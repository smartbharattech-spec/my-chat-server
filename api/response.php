<?php
define('NO_JSON_HEADER', true);
require_once 'config.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $orderId = $_POST['order_id'] ?? '';
    $paymentStatus = $_POST['payment_status'] ?? '';

    // Automated Approval Logic
    if ($paymentStatus == "success" && !empty($orderId)) {
        try {
            $parts = explode('_', $orderId);
            $payment_id = $parts[1] ?? null;

            if ($payment_id) {
                $pdo->beginTransaction();

                // 1. Get payment details
                $stmt = $pdo->prepare("SELECT email, project_id, plan, purchase_type FROM payments WHERE id = ?");
                $stmt->execute([$payment_id]);
                $payment = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($payment) {
                    // 2. Update payment status to 'Active'
                    $stmt = $pdo->prepare("UPDATE payments SET status = 'Active' WHERE id = ?");
                    $stmt->execute([$payment_id]);

                    // 3. Sync plan to project/user (same as manual approval)
                    $stmtPlan = $pdo->prepare("SELECT id FROM plans WHERE title = ? LIMIT 1");
                    $stmtPlan->execute([$payment['plan']]);
                    $planData = $stmtPlan->fetch(PDO::FETCH_ASSOC);
                    $plan_id = $planData ? $planData['id'] : null;

                    if ($payment['project_id']) {
                        $stmt = $pdo->prepare("UPDATE projects SET plan_name = ?, plan_id = ? WHERE id = ?");
                        $stmt->execute([$payment['plan'], $plan_id, $payment['project_id']]);
                    }

                    if ($payment['purchase_type'] !== 'single_purchase') {
                        $stmt = $pdo->prepare("UPDATE users SET plan = ?, plan_id = ? WHERE email = ?");
                        $stmt->execute([$payment['plan'], $plan_id, $payment['email']]);
                    }
                }

                $pdo->commit();
            }
        } catch (Exception $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            error_log("Auto-approval failed for Order $orderId: " . $e->getMessage());
        }
    }

    // Redirecting back to app
    if ($paymentStatus == "success") {
        header("Location: " . APP_URL . "/#/dashboard?tab=My%20Plans&status=success");
    } else {
        header("Location: " . APP_URL . "/#/dashboard?tab=My%20Plans&status=failed");
    }

} else {
    header("Location: " . APP_URL . "/#/dashboard?tab=My%20Plans&status=failed");
}
exit;
?>