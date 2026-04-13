<?php
// Prevent any warnings from being displayed in output
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config.php';

// If config.php didn't set this (depending on NO_JSON_HEADER)
if (!headers_sent()) {
    header('Content-Type: application/json');
}

$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required']);
    exit;
}

try {
    // We select explicit columns to be 100% safe with UNION ALL on Different MySQL versions
    $columns = "p.id, p.expert_id, p.name, p.description, p.price, p.image_url, p.status, p.created_at, p.product_type, p.attributes, p.bulk_pricing, p.images, p.is_super_profile, p.stock_quantity, p.low_stock_threshold, p.manage_stock";
    
    $sql = "
        SELECT $columns, p.expert_id as seller_id, 0 as is_imported 
        FROM marketplace_products p 
        WHERE p.expert_id = ? AND p.status = 'active'
        
        UNION ALL
        
        SELECT $columns, i.expert_id as seller_id, 1 as is_imported 
        FROM marketplace_products p 
        JOIN marketplace_expert_imports i ON p.id = i.product_id 
        WHERE i.expert_id = ? AND p.status = 'active'
        
        ORDER BY created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$expert_id, $expert_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Filter to ensure no duplicate keys if somehow a product is both owned and imported
    $unique_products = [];
    $ids = [];
    foreach ($products as $p) {
        $unique_key = $p['id'] . '_' . $p['seller_id'];
        if (!in_array($unique_key, $ids)) {
            $ids[] = $unique_key;
            $p['price'] = (float)$p['price'];
            $p['is_imported'] = (int)$p['is_imported'];
            $p['seller_id'] = (int)$p['seller_id'];
            $unique_products[] = $p;
        }
    }

    echo json_encode([
        'status' => 'success',
        'products' => $unique_products
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'API Error: ' . $e->getMessage()]);
}
?>
