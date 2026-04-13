<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
$product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$amount = isset($data['amount']) ? (float)$data['amount'] : 0;
$type = isset($data['type']) ? $data['type'] : 'product';

if (!$user_id || !$expert_id || !$product_id || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required order details.']);
    exit;
}

try {
    // Calculate GST
    $subtotal = $amount;
    $gst_rate = 18.00;
    $gst_amount = $subtotal * ($gst_rate / 100);
    $total_amount = $subtotal + $gst_amount;

    $stmt = $pdo->prepare("INSERT INTO marketplace_orders (user_id, expert_id, product_id, item_type, amount, subtotal, gst_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')");
    $stmt->execute([$user_id, $expert_id, $product_id, $type, $total_amount, $subtotal, $gst_amount]);
    $order_id = $pdo->lastInsertId();

    echo json_encode(['status' => 'success', 'message' => 'Order placed successfully.', 'order_id' => $order_id, 'total' => $total_amount]);
} catch (PDOException $e) {
    // Attempt to add column if it fails due to missing column
    if (strpos($e->getMessage(), "Unknown column 'item_type'") !== false) {
        $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN item_type VARCHAR(20) DEFAULT 'product' AFTER product_id");
        // Retry
        $stmt = $pdo->prepare("INSERT INTO marketplace_orders (user_id, expert_id, product_id, item_type, amount, subtotal, gst_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')");
        $stmt->execute([$user_id, $expert_id, $product_id, $type, $total_amount, $subtotal, $gst_amount]);
        $order_id = $pdo->lastInsertId();
        echo json_encode(['status' => 'success', 'message' => 'Order placed successfully.', 'order_id' => $order_id, 'total' => $total_amount]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to place order: ' . $e->getMessage()]);
    }
}
?>
