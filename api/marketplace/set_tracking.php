<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

$order_id = isset($data['order_id']) ? (int)$data['order_id'] : 0;
$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
$tracking_link = isset($data['tracking_link']) ? trim($data['tracking_link']) : '';
$tracking_id = isset($data['tracking_id']) ? trim($data['tracking_id']) : '';

if (!$order_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE marketplace_orders SET tracking_link = ?, tracking_id = ?, status = 'shipped' WHERE id = ? AND expert_id = ?");
    $stmt->execute([$tracking_link, $tracking_id, $order_id, $expert_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Tracking information updated.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Order not found or no changes made.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
