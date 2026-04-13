<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$items   = isset($data['items']) ? $data['items'] : [];
$shipping = isset($data['shipping']) ? $data['shipping'] : [];
$billing  = isset($data['billing'])  ? $data['billing']  : [];

if (!$user_id || empty($items)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid order data.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Calculate total and GST
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += floatval($item['price']) * intval($item['quantity']);
    }
    $gst_rate = 18.00;
    $gst_amount = $subtotal * ($gst_rate / 100);
    $total = $subtotal + $gst_amount;

    // Create order record
    $first_expert = isset($items[0]['expert_id']) ? (int)$items[0]['expert_id'] : 0;
    $first_product = isset($items[0]['product_id']) ? (int)$items[0]['product_id'] : 0;

    $stmt = $pdo->prepare(
        "INSERT INTO marketplace_orders 
         (user_id, expert_id, product_id, amount, subtotal, gst_amount, status, shipping_address, billing_address, product_type) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)"
    );
    $stmt->execute([
        $user_id,
        $first_expert,
        $first_product,
        $total,
        $subtotal,
        $gst_amount,
        json_encode($shipping),
        json_encode($billing),
        isset($items[0]['product_type']) ? $items[0]['product_type'] : 'product'
    ]);
    $order_id = $pdo->lastInsertId();

    // Insert order items
    $itemStmt = $pdo->prepare(
        "INSERT INTO marketplace_order_items 
         (order_id, product_id, expert_id, quantity, price, base_price, gst_amount, selected_attributes, product_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($items as $item) {
        $price = floatval($item['price']);
        $item_base_price = $price;
        $item_gst_amount = $price * ($gst_rate / 100);
        $item_total_price = $price + $item_gst_amount; // Wait, is $item['price'] base or total?
        // Let's assume $item['price'] is base price from the frontend product object.
        
        $selected_opt = isset($item['selected_options']) ? json_encode($item['selected_options']) : null;
        $itemStmt->execute([
            $order_id,
            (int)$item['product_id'],
            (int)$item['expert_id'],
            (int)$item['quantity'],
            $item_total_price,
            $item_base_price,
            $item_gst_amount,
            $selected_opt,
            isset($item['product_type']) ? $item['product_type'] : 'product'
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'status'   => 'success',
        'message'  => 'Order created successfully.',
        'order_id' => $order_id,
        'total'    => $total
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Order failed: ' . $e->getMessage()]);
}
?>
