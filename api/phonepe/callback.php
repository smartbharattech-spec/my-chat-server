<?php
// api/phonepe/callback.php
$configPath = '../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);


// PhonePe sends response via POST, but some flows use GET for redirection
$response = $_POST['code'] ?? 'FAILED';
$merchantId = $_POST['merchantId'] ?? '';
$transactionId = $_POST['transactionId'] ?? $_GET['order_id'] ?? '';
$amount = $_POST['amount'] ?? 0;
$providerReferenceId = $_POST['providerReferenceId'] ?? '';
$checksum = $_SERVER['HTTP_X_VERIFY'] ?? '';


// Check if successful
$status = 'FAILED';
$message = 'Payment Failed';

// In a real scenario, you MUST verify the checksum here using your Salt Key
// For now, checking the code
if ($response === 'PAYMENT_SUCCESS') {
    $status = 'SUCCESS';
    $message = 'Payment Successful';
} elseif ($response === 'PAYMENT_JPENDING') {
    $status = 'PENDING';
    $message = 'Payment Pending';
} else {
    $status = 'FAILED';
    $message = 'Payment Failed or Cancelled';
}

// Extract ID from transactionId (Format: TYPE_ID_TIMESTAMP)
// e.g., PLAN_123_1789 or MAP_456_1789
$parts = explode('_', $transactionId);
$type = $parts[0] ?? '';
$db_id = $parts[1] ?? '';

if ($db_id && $type) {
    global $pdo;

    if ($type === 'PLAN') {
        // Update payments table
        $newStatus = ($status === 'SUCCESS') ? 'Completed' : 'Failed';
        $stmt = $pdo->prepare("UPDATE payments SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $db_id]);

        // If Success, update user plan
        if ($newStatus === 'Completed') {
            // Get payment details to find user email and plan
            $pStmt = $pdo->prepare("SELECT email, plan, plan_id, purchase_type, project_id, project_details FROM payments WHERE id = ?");
            $pStmt->execute([$db_id]);
            $paymentData = $pStmt->fetch(PDO::FETCH_ASSOC);

            if ($paymentData) {
                // Get plan details by NAME to ensure correct ID on this environment
                $plStmt = $pdo->prepare("SELECT id, validity_days FROM plans WHERE title = ?");
                $plStmt->execute([$paymentData['plan']]);
                $planDetails = $plStmt->fetch(PDO::FETCH_ASSOC);

                // Use the ID from the database, fallback to the one in payment if not found (rare)
                $real_plan_id = $planDetails ? $planDetails['id'] : $paymentData['plan_id'];
                $validity = $planDetails ? (int) $planDetails['validity_days'] : 30;

                // Sync plan to EXISTING project
                if ($paymentData['project_id']) {
                    $uProjStmt = $pdo->prepare("UPDATE projects SET plan_name = ?, plan_id = ? WHERE id = ?");
                    $uProjStmt->execute([$paymentData['plan'], $real_plan_id, $paymentData['project_id']]);
                }

                // Auto-create project if details exist and it's a single purchase AND no project_id linked yet
                if ($paymentData['purchase_type'] === 'single_purchase' && !empty($paymentData['project_details']) && !$paymentData['project_id']) {
                    $projectDetails = json_decode($paymentData['project_details'], true);
                    if ($projectDetails) {
                        try {
                            $stmt = $pdo->prepare("INSERT INTO projects (email, project_name, construction_type, project_issue, plan_name, plan_id) VALUES (?, ?, ?, ?, ?, ?)");
                            $stmt->execute([
                                $paymentData['email'],
                                $projectDetails['project_name'],
                                $projectDetails['construction_type'] ?? 'Existing',
                                $projectDetails['project_issue'] ?? null,
                                $paymentData['plan'],
                                $real_plan_id
                            ]);
                            $newProjectId = $pdo->lastInsertId();

                            // Link payment to new project
                            $updatePayment = $pdo->prepare("UPDATE payments SET project_id = ? WHERE id = ?");
                            $updatePayment->execute([$newProjectId, $db_id]);

                        } catch (Exception $e) {
                            error_log("Callback Project Creation Failed: " . $e->getMessage());
                        }
                    }
                }

                // Update user plan ONLY if it's a subscription/upgrade
                // We check:
                // 1. purchase_type isn't single_purchase
                // 2. AND the plan_type from DB is 'subscription'
                $real_plan_type = ($planDetails && isset($planDetails['plan_type'])) ? $planDetails['plan_type'] : 'subscription';

                if ($paymentData['purchase_type'] !== 'single_purchase' && $real_plan_type === 'subscription') {
                    // Mark previous active subscription plans as Inactive
                    $expireStmt = $pdo->prepare("UPDATE payments SET status = 'Inactive' WHERE email = ? AND status = 'Active' AND (purchase_type != 'single_purchase' OR plan IN (SELECT title FROM plans WHERE plan_type = 'subscription')) AND id != ?");
                    $expireStmt->execute([$paymentData['email'], $db_id]);

                    $uStmt = $pdo->prepare("UPDATE users SET plan = ?, plan_id = ?, plan_activated_at = NOW(), plan_expiry = ? WHERE email = ?");
                    $uStmt->execute([$paymentData['plan'], $real_plan_id, $expiry, $paymentData['email']]);
                }
            }
        }
    } elseif ($type === 'MAP') {
        // Update map_requests table
        $newStatus = ($status === 'SUCCESS') ? 'paid' : 'payment_failed';
        $stmt = $pdo->prepare("UPDATE map_requests SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $db_id]);
    } elseif ($type === 'OCCULT') {
        // Update marketplace_orders table
        $newStatus = ($status === 'SUCCESS') ? 'paid' : 'pending';
        $newPaymentStatus = ($status === 'SUCCESS') ? 'completed' : 'failed';
        $stmt = $pdo->prepare("UPDATE marketplace_orders SET status = ?, payment_status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $newPaymentStatus, $db_id]);

        if ($status === 'SUCCESS') {
            require_once '../marketplace/wallet_helper.php';
            processOrderCommission($pdo, $db_id);

            // --- Automate Stock Reduction ---
            // 1. Check if there are multiple items in marketplace_order_items
            $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM marketplace_order_items WHERE order_id = ?");
            $itemStmt->execute([$db_id]);
            $items = $itemStmt->fetchAll();

            if ($items) {
                foreach ($items as $item) {
                    $qty = (int)$item['quantity'];
                    $pid = (int)$item['product_id'];
                    $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND manage_stock = 1")
                        ->execute([$qty, $pid]);
                }
            } else {
                // Fallback: get product_id from order table if items list is empty
                $oStmt = $pdo->prepare("SELECT product_id FROM marketplace_orders WHERE id = ?");
                $oStmt->execute([$db_id]);
                $order = $oStmt->fetch();
                if ($order && !empty($order['product_id'])) {
                    $pid = (int)$order['product_id'];
                    $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - 1) WHERE id = ? AND manage_stock = 1")
                        ->execute([$pid]);
                }
            }
        }
    } elseif ($type === 'CREDIT') {
        // Update marketplace_credit_requests table
        $newPaymentStatus = ($status === 'SUCCESS') ? 'completed' : 'failed';
        $newStatus = ($status === 'SUCCESS') ? 'approved' : 'pending';
        
        $stmt = $pdo->prepare("UPDATE marketplace_credit_requests SET payment_status = ?, status = ? WHERE id = ?");
        $stmt->execute([$newPaymentStatus, $newStatus, $db_id]);

        if ($status === 'SUCCESS') {
            // Fetch credits info
            $reqStmt = $pdo->prepare("SELECT user_id, credits FROM marketplace_credit_requests WHERE id = ?");
            $reqStmt->execute([$db_id]);
            $request = $reqStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($request) {
                // Add credits to user
                $uStmt = $pdo->prepare("UPDATE marketplace_users SET credits = COALESCE(credits, 0) + ? WHERE id = ?");
                $uStmt->execute([$request['credits'], $request['user_id']]);
            }
        }
    }
}

// UI to show status
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Status</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
        }

        h1 {
            margin-bottom: 10px;
            font-size: 24px;
        }

        p {
            color: #666;
            margin-bottom: 30px;
        }

        .success {
            color: #16a34a;
        }

        .error {
            color: #dc2626;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #673ab7;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: background 0.3s;
        }

        .btn:hover {
            background: #5e35b1;
        }

        .icon {
            font-size: 60px;
            margin-bottom: 20px;
            display: block;
        }
    </style>
</head>

<body>
    <div class="card">
        <?php if ($status === 'SUCCESS'): ?>
            <span class="icon">✅</span>
            <h1 class="success">Payment Successful!</h1>
            <p>Your transaction has been completed.</p>
        <?php else: ?>
            <span class="icon">❌</span>
            <h1 class="error">Payment Failed</h1>
            <p>Transaction failed or was cancelled.</p>
        <?php endif; ?>

        <p>Order ID: <strong><?php echo htmlspecialchars($transactionId); ?></strong></p>

        <?php
        $returnUrl = $_GET['return_url'] ?? '/#/dashboard';
        ?>
        <a href="<?php echo htmlspecialchars($returnUrl); ?>" class="btn">Return to Dashboard</a>
    </div>

    <script>
        // Auto redirect after 5 seconds
        setTimeout(() => {
            window.location.href = '<?php echo $returnUrl; ?>';
        }, 5000);
    </script>
</body>

</html>