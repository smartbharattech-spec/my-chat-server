<?php
require_once '../config.php';

// If config.php didn't set this (depending on NO_JSON_HEADER)
if (!headers_sent()) {
    header('Content-Type: application/json');
}

try {
    // UNION to get original products and imported products
    // For imported: seller ID is from marketplace_expert_imports
    $stmt = $pdo->prepare("
        (SELECT p.*, m.id as seller_id, m.name as expert_name, e.slug as expert_slug, e.profile_image as expert_profile_image, 0 as is_imported
         FROM marketplace_products p
         JOIN marketplace_users m ON p.expert_id = m.id
         LEFT JOIN expert_profiles e ON m.id = e.user_id
         WHERE p.status = 'active')
        UNION ALL
        (SELECT p.*, m.id as seller_id, m.name as expert_name, e.slug as expert_slug, e.profile_image as expert_profile_image, 1 as is_imported
         FROM marketplace_products p
         JOIN marketplace_expert_imports i ON p.id = i.product_id
         JOIN marketplace_users m ON i.expert_id = m.id
         LEFT JOIN expert_profiles e ON m.id = e.user_id
         WHERE p.status = 'active')
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add unique listing ID for frontend keys
    foreach ($products as &$p) {
        $p['listing_id'] = $p['id'] . '_' . $p['seller_id'];
    }

    echo json_encode([
        'status' => 'success',
        'products' => $products
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
