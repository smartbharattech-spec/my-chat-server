<?php
require_once '../config.php';

if (!headers_sent()) {
    header('Content-Type: application/json');
}

$product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

if (!$product_id) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID is required']);
    exit;
}

try {
    $seller_id = isset($_GET['seller_id']) ? (int)$_GET['seller_id'] : 0;

    // Get product and join with marketplace_users and expert_profiles for expert name, slug and image
    // If seller_id is provided, we join with THAT seller's info.
    // Otherwise, we join with the product's original expert_id.
    $sql = "
        SELECT p.*, m.id as seller_id, m.name as expert_name, e.profile_image as expert_profile_image, e.slug as expert_slug 
        FROM marketplace_products p
    ";

    if ($seller_id > 0) {
        $sql .= "
            JOIN marketplace_users m ON m.id = ?
            LEFT JOIN expert_profiles e ON m.id = e.user_id 
        ";
        $params = [$seller_id, $product_id];
    } else {
        $sql .= "
            JOIN marketplace_users m ON p.expert_id = m.id
            LEFT JOIN expert_profiles e ON m.id = e.user_id 
        ";
        $params = [$product_id];
    }

    $sql .= " WHERE p.id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    // ERROR LOGGING FOR DEBUGGING
    error_log("GET_PRODUCT: ID=" . $product_id . " RESULT=" . ($product ? "FOUND" : "NOT_FOUND"));

    if (!$product) {
        echo json_encode(['status' => 'error', 'message' => 'Product not found (ID: ' . $product_id . ')']);
        exit;
    }

    if ($product['status'] !== 'active') {
        echo json_encode(['status' => 'error', 'message' => 'This product is currently inactive']);
        exit;
    }

    // Expert profile check is now built into the LEFT JOIN; if expert_name is missing, something is wrong.
    if (!$product['expert_name']) {
        echo json_encode(['status' => 'error', 'message' => 'Expert details not found for this product']);
        exit;
    }

    // Decode JSON fields if they are strings
    if (isset($product['attributes']) && is_string($product['attributes'])) {
        $product['attributes'] = json_decode($product['attributes'], true);
    }
    if (isset($product['bulk_pricing']) && is_string($product['bulk_pricing'])) {
        $product['bulk_pricing'] = json_decode($product['bulk_pricing'], true);
    }
    if (isset($product['images']) && is_string($product['images'])) {
        $product['images'] = json_decode($product['images'], true);
    }

    echo json_encode([
        'status' => 'success',
        'product' => $product
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
