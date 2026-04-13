<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$role = isset($_GET['role']) ? $_GET['role'] : 'user';

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    $query = "SELECT o.*, 
                     CASE 
                        WHEN o.product_type = 'course' THEN c.title 
                        ELSE p.name 
                     END as product_name,
                     CASE 
                        WHEN o.product_type = 'course' THEN c.thumbnail 
                        ELSE p.image_url 
                     END as product_image,
                     u_exp.name as expert_name, u_usr.name as seeker_name,
                     (SELECT selected_attributes FROM marketplace_order_items oi 
                      WHERE oi.order_id = o.id 
                      ORDER BY (oi.product_id = o.product_id) DESC 
                      LIMIT 1) as selected_options
              FROM marketplace_orders o
              LEFT JOIN marketplace_products p ON o.product_id = p.id AND o.product_type != 'course'
              LEFT JOIN courses c ON o.product_id = c.id AND o.product_type = 'course'
              JOIN marketplace_users u_exp ON o.expert_id = u_exp.id
              JOIN marketplace_users u_usr ON o.user_id = u_usr.id";

    if ($role === 'expert') {
        $query .= " WHERE o.expert_id = ? ORDER BY o.created_at DESC";
    } elseif ($role === 'admin') {
        $query .= " ORDER BY o.created_at DESC";
    } else {
        $query .= " WHERE o.user_id = ? ORDER BY o.created_at DESC";
    }

    $stmt = $pdo->prepare($query);
    if ($role === 'admin') {
        $stmt->execute([]);
    } else {
        $stmt->execute([$user_id]);
    }
    
    $orders = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'orders' => $orders]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch orders: ' . $e->getMessage()]);
}
?>
