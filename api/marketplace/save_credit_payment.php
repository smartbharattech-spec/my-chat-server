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
    // 1. Get plan details
    $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_plans WHERE id = ? AND status = 'active'");
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch();

    if (!$plan) {
        echo json_encode(['status' => 'error', 'message' => 'Credit plan not found or inactive.']);
        exit;
    }

    // 2. Check for existing pending request to reuse
    $stmt = $pdo->prepare("SELECT id FROM marketplace_credit_requests WHERE user_id = ? AND plan_id = ? AND status = 'pending' AND payment_status = 'pending' ORDER BY id DESC LIMIT 1");
    $stmt->execute([$user_id, $plan_id]);
    $existing = $stmt->fetch();

    if ($existing) {
        echo json_encode(['status' => 'success', 'id' => $existing['id'], 'amount' => $plan['price']]);
        exit;
    }

    // 3. Create new request
    $stmt = $pdo->prepare("INSERT INTO marketplace_credit_requests (user_id, plan_id, amount, credits, status, payment_status) VALUES (?, ?, ?, ?, 'pending', 'pending')");
    $stmt->execute([$user_id, $plan_id, $plan['price'], $plan['credits']]);
    $newId = $pdo->lastInsertId();

    echo json_encode(['status' => 'success', 'id' => $newId, 'amount' => $plan['price']]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
