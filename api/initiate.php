<?php
define('NO_JSON_HEADER', true);
require_once 'config.php';

// Capture parameters from GET for automation
$order_id = $_GET['order_id'] ?? '';
$amount = $_GET['amount'] ?? '';

// Save the Order ID to DB for history/tracking
if ($order_id) {
    $parts = explode('_', $order_id);
    $type = $parts[0] ?? ''; // PLAN or MAP
    $db_id = $parts[1] ?? '';

    if ($db_id) {
        try {
            if ($type === 'PLAN') {
                $stmt = $pdo->prepare("UPDATE payments SET transaction_id = ? WHERE id = ?");
                $stmt->execute([$order_id, $db_id]);
            } elseif ($type === 'MAP') {
                $stmt = $pdo->prepare("UPDATE map_requests SET transaction_id = ? WHERE id = ?");
                $stmt->execute([$order_id, $db_id]);
            } elseif ($type === 'OCCULT') {
                $stmt = $pdo->prepare("UPDATE marketplace_orders SET transaction_id = ? WHERE id = ?");
                $stmt->execute([$order_id, $db_id]);
            } elseif ($type === 'CREDIT') {
                $stmt = $pdo->prepare("UPDATE marketplace_credit_requests SET transaction_id = ? WHERE id = ?");
                $stmt->execute([$order_id, $db_id]);
            }
        } catch (PDOException $e) {
            error_log("Failed to save order_id to DB: " . $e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html>

<head>
    <title>Redirecting to Payment...</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f8fafc;
            color: #334155;
        }

        .loader-container {
            text-align: center;
        }

        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #f97316;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        h2 {
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        p {
            opacity: 0.7;
            font-size: 0.9rem;
        }
    </style>
</head>

<body>

    <div class="loader-container">
        <div class="spinner"></div>
        <h2>Processing Payment...</h2>
        <p>Please wait, we are redirecting you to the payment gateway.</p>
    </div>

    <script>
        fetch('<?php echo API_URL; ?>/phonepe/initiate.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                order_id: '<?php echo htmlspecialchars($order_id); ?>', 
                amount: '<?php echo htmlspecialchars($amount); ?>' 
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                alert('Payment Setup Failed: ' + (data.message || 'Server returned invalid response'));
                console.error(data);
                window.location.href = '/#/dashboard';
            }
        })
        .catch(err => {
            alert('Error initiating payment with gateway.');
            console.error(err);
            window.location.href = '/#/dashboard';
        });
    </script>

</body>

</html>