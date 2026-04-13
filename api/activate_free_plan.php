<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$project_id = $data['project_id'] ?? null;
$plan_id = $data['plan_id'] ?? null;

if (!$email || !$plan_id) {
    echo json_encode(["status" => "error", "message" => "Email and Plan ID are required"]);
    exit;
}

try {
    // 1. Verify if the plan is actually free
    $stmt = $pdo->prepare("SELECT * FROM plans WHERE id = ?");
    $stmt->execute([$plan_id]);
    $planData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$planData || $planData['is_free'] != 1) {
        echo json_encode(["status" => "error", "message" => "This plan is not free."]);
        exit;
    }

    $pdo->beginTransaction();

    $project_details = $data['project_details'] ?? null;

    // 2. Create an Active payment record
    $stmt = $pdo->prepare("INSERT INTO payments (email, project_id, plan, plan_id, price, credits, status, purchase_type, project_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $email,
        $project_id,
        $planData['title'],
        $plan_id,
        0, // Price is 0 for free plan
        $planData['credits'],
        'Active',
        $project_id ? 'single_purchase' : 'new_purchase',
        is_array($project_details) ? json_encode($project_details) : $project_details
    ]);

    $payment_id = $pdo->lastInsertId();

    // 3. Sync plan to project/user
    if ($project_id) {
        $stmt = $pdo->prepare("UPDATE projects SET plan_name = ?, plan_id = ? WHERE id = ?");
        $stmt->execute([$planData['title'], $plan_id, $project_id]);
    } elseif ($planData['plan_type'] === 'single' && !empty($project_details)) {
        // Auto-create project for FREE single purchase
        $pDetails = is_array($project_details) ? $project_details : json_decode($project_details, true);
        if ($pDetails) {
            $stmt = $pdo->prepare("INSERT INTO projects (email, project_name, construction_type, project_issue, plan_name, plan_id) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $email,
                $pDetails['project_name'],
                $pDetails['construction_type'] ?? 'Existing',
                $pDetails['project_issue'] ?? null,
                $planData['title'],
                $plan_id
            ]);
            $newProjectId = $pdo->lastInsertId();

            // Link payment to this new project
            $linkStmt = $pdo->prepare("UPDATE payments SET project_id = ? WHERE id = ?");
            $linkStmt->execute([$newProjectId, $payment_id]);
        }
    } elseif ($planData['plan_type'] === 'subscription') {
        $validity_days = (int) ($planData['validity_days'] ?? 30);
        if ($validity_days <= 0)
            $validity_days = 3650; // 10 years for "Unlimited"

        $stmt = $pdo->prepare("UPDATE users SET plan = ?, plan_id = ?, plan_activated_at = NOW(), plan_expiry = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE email = ?");
        $stmt->execute([$planData['title'], $plan_id, $validity_days, $email]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Plan activated successfully!", "payment_id" => $payment_id]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>