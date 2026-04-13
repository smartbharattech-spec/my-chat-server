<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$plan_id = isset($input['plan_id']) ? (int)$input['plan_id'] : 0;

if (!$user_id || !$plan_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user_id or plan_id.']);
    exit;
}

try {
    // Check if plan exists and is active
    $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_plans WHERE id = ? AND status = 'active'");
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch();

    if (!$plan) {
        echo json_encode(['status' => 'error', 'message' => 'Credit plan not found or inactive.']);
        exit;
    }

    // Insert request
    $stmt = $pdo->prepare("INSERT INTO marketplace_credit_requests (user_id, plan_id, amount, credits, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->execute([$user_id, $plan_id, $plan['price'], $plan['credits']]);

    echo json_encode(['status' => 'success', 'message' => 'Credit request submitted successfully. Waiting for admin approval.']);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
