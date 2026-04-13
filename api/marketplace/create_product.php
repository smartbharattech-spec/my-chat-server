<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'No data provided']);
    exit;
}

$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
$name = isset($data['name']) ? trim($data['name']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$price = isset($data['price']) ? (float)$data['price'] : 0.00;
$image_url = isset($data['image_url']) ? trim($data['image_url']) : '';
$product_id = isset($data['id']) ? (int)$data['id'] : 0;

// New fields
$product_type = isset($data['product_type']) ? trim($data['product_type']) : 'product';
$attributes = isset($data['attributes']) ? json_encode($data['attributes']) : null;
$bulk_pricing = isset($data['bulk_pricing']) ? json_encode($data['bulk_pricing']) : null;
$images = isset($data['images']) ? json_encode($data['images']) : null;
$is_super_profile = isset($data['is_super_profile']) ? (int)$data['is_super_profile'] : 0;
$stock_quantity = isset($data['stock_quantity']) ? (int)$data['stock_quantity'] : 0;
$low_stock_threshold = isset($data['low_stock_threshold']) ? (int)$data['low_stock_threshold'] : 5;
$manage_stock = isset($data['manage_stock']) ? (int)$data['manage_stock'] : 0;
$gst_enabled = isset($data['gst_enabled']) ? (bool)$data['gst_enabled'] : true;

if (!$expert_id || !$name) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID and Product Name are required']);
    exit;
}

try {
    // GST Calculation
    $base_price = (float)$price;
    $gst_rate = $gst_enabled ? 18.00 : 0.00;
    $gst_amount = $base_price * ($gst_rate / 100);
    $total_price = $base_price + $gst_amount;

    if ($product_id > 0) {
        // Update existing product
        $stmt = $pdo->prepare("UPDATE marketplace_products SET name = ?, description = ?, price = ?, base_price = ?, gst_rate = ?, gst_amount = ?, total_price = ?, image_url = ?, product_type = ?, attributes = ?, bulk_pricing = ?, images = ?, is_super_profile = ?, stock_quantity = ?, low_stock_threshold = ?, manage_stock = ? WHERE id = ? AND expert_id = ?");
        $stmt->execute([$name, $description, $price, $base_price, $gst_rate, $gst_amount, $total_price, $image_url, $product_type, $attributes, $bulk_pricing, $images, $is_super_profile, $stock_quantity, $low_stock_threshold, $manage_stock, $product_id, $expert_id]);
        $message = "Product updated successfully";
    } else {
        // Create new product
        $stmt = $pdo->prepare("INSERT INTO marketplace_products (expert_id, name, description, price, base_price, gst_rate, gst_amount, total_price, image_url, product_type, attributes, bulk_pricing, images, is_super_profile, stock_quantity, low_stock_threshold, manage_stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$expert_id, $name, $description, $price, $base_price, $gst_rate, $gst_amount, $total_price, $image_url, $product_type, $attributes, $bulk_pricing, $images, $is_super_profile, $stock_quantity, $low_stock_threshold, $manage_stock]);
        $message = "Product created successfully";
        $product_id = $pdo->lastInsertId();
    }

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'product_id' => $product_id
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
