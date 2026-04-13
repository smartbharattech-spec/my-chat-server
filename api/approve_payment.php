<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payment_id = $_POST['payment_id'] ?? null;

    if (!$payment_id) {
        echo json_encode(["status" => "error", "message" => "Payment ID is required."]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Get payment details and input status
        $status = $_POST['status'] ?? 'Active';

        $stmt = $pdo->prepare("SELECT email, project_id, plan, purchase_type, project_details FROM payments WHERE id = ?");
        $stmt->execute([$payment_id]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payment) {
            echo json_encode(["status" => "error", "message" => "Payment record not found."]);
            $pdo->rollBack();
            exit;
        }

        // 2. Update payment status
        $stmt = $pdo->prepare("UPDATE payments SET status = ? WHERE id = ?");
        $stmt->execute([$status, $payment_id]);

        // 3. Update project plan and optionally user plan only if status is Active
        if ($status === 'Active') {
            // Fetch plan details from plans table
            // Using SELECT * to avoid errors if specific columns (like plan_type) are missing in some envs
            $stmtPlan = $pdo->prepare("SELECT * FROM plans WHERE title = ? LIMIT 1");
            $stmtPlan->execute([$payment['plan']]);
            $planData = $stmtPlan->fetch(PDO::FETCH_ASSOC);

            $plan_id = $planData ? $planData['id'] : null;
            $validity_days = ($planData && isset($planData['validity_days'])) ? (int) $planData['validity_days'] : 30;
            $real_plan_type = ($planData && isset($planData['plan_type'])) ? $planData['plan_type'] : 'subscription'; // Default to subscription if unknown

            // 4. Update specific project or find latest if unlinked
            $f_status = ($planData && isset($planData['followup_enabled']) && (int) $planData['followup_enabled'] === 1) ? 'pending' : 'none';
            $f_start = ($f_status === 'pending') ? date('Y-m-d H:i:s') : null;

            if ($payment['project_id']) {
                $stmt = $pdo->prepare("UPDATE projects SET plan_name = ?, plan_id = ?, followup_status = ?, followup_start_at = ? WHERE id = ?");
                $stmt->execute([$payment['plan'], $plan_id, $f_status, $f_start, $payment['project_id']]);
            } elseif ($f_status === 'pending') {
                // If no project_id linked to payment, but it's a follow-up plan, find the latest project of this user
                $stmt = $pdo->prepare("SELECT id FROM projects WHERE email = ? ORDER BY id DESC LIMIT 1");
                $stmt->execute([$payment['email']]);
                $latestProject = $stmt->fetch();
                if ($latestProject) {
                    $stmt = $pdo->prepare("UPDATE projects SET followup_status = ?, followup_start_at = ? WHERE id = ?");
                    $stmt->execute(['pending', $f_start, $latestProject['id']]);
                } else {
                    // Create a default project so it shows up in Admin Follow-up Requests
                    $stmtCreate = $pdo->prepare("INSERT INTO projects (email, project_name, plan_name, plan_id, followup_status, followup_start_at) VALUES (?, ?, ?, ?, 'pending', ?)");
                    $stmtCreate->execute([$payment['email'], 'Main Project', $payment['plan'], $plan_id, $f_start]);
                }
            }

            // Create project on payment approval if it's a single purchase and project details are provided
            if ($payment['purchase_type'] === 'single_purchase' && $payment['project_details'] && !$payment['project_id']) {
                $projectDetails = json_decode($payment['project_details'], true);
                if ($projectDetails) {
                    try {
                        $f_status = ($planData && isset($planData['followup_enabled']) && (int) $planData['followup_enabled'] === 1) ? 'pending' : 'none';
                        $f_start = ($f_status === 'pending') ? date('Y-m-d H:i:s') : null;
                        $pParams = [
                            'email' => $payment['email'],
                            'project_name' => $projectDetails['project_name'],
                            'construction_type' => $projectDetails['construction_type'] ?? 'Existing',
                            'project_issue' => $projectDetails['project_issue'] ?? null,
                            'plan_name' => $payment['plan'],
                            'plan_id' => $plan_id,
                            'followup_status' => $f_status,
                            'followup_start_at' => $f_start
                        ];
                        $pStmt = $pdo->prepare("INSERT INTO projects (email, project_name, construction_type, project_issue, plan_name, plan_id, followup_status, followup_start_at) VALUES (:email, :project_name, :construction_type, :project_issue, :plan_name, :plan_id, :followup_status, :followup_start_at)");
                        $pStmt->execute($pParams);
                        $newProjectId = $pdo->lastInsertId();

                        // Link payment to this newly created project
                        $linkStmt = $pdo->prepare("UPDATE payments SET project_id = ? WHERE id = ?");
                        $linkStmt->execute([$newProjectId, $payment_id]);

                    } catch (Exception $e) {
                        error_log("Failed to auto-create project for payment $payment_id: " . $e->getMessage());
                    }
                }
            }

            // Update user global plan IF:
            // 1. It is explicitly NOT a single_purchase (based on payment metadata)
            // 2. AND the actual plan type in DB is 'subscription' (final safety check)
            $shouldUpdateUserPlan = ($payment['purchase_type'] !== 'single_purchase') && ($real_plan_type === 'subscription');

            if ($shouldUpdateUserPlan) {
                // Mark previous active subscription plans as Inactive
                // Fix: Only expire other subscription plans, not single-purchase ones!
                $expireStmt = $pdo->prepare("
                    UPDATE payments 
                    SET status = 'Inactive' 
                    WHERE email = ? 
                    AND status = 'Active' 
                    AND id != ?
                    AND (
                        purchase_type = 'new_purchase' 
                        OR purchase_type = 'upgrade' 
                        OR plan IN (SELECT title FROM plans WHERE plan_type = 'subscription')
                    )
                ");
                $expireStmt->execute([$payment['email'], $payment_id]);

                $expiry_date = date('Y-m-d H:i:s', strtotime("+$validity_days days"));

                $stmt = $pdo->prepare("UPDATE users SET plan = ?, plan_id = ?, plan_activated_at = NOW(), plan_expiry = ? WHERE email = ?");
                $stmt->execute([$payment['plan'], $plan_id, $expiry_date, $payment['email']]);
            }

            $message = "Payment approved and project/user plan updated accordingly.";
        } else {
            $message = "Payment status updated to " . $status;
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => $message]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>