<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    // 1. Get Counts
    // Experts (Pending & Total)
    $expert_stats = $pdo->query("
        SELECT 
            COUNT(*) as total_experts,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_experts
        FROM marketplace_users 
        WHERE role = 'expert'
    ")->fetch(PDO::FETCH_ASSOC);

    // Users
    $user_count = $pdo->query("SELECT COUNT(*) FROM marketplace_users WHERE role = 'user'")->fetchColumn();

    // Products
    $product_count = $pdo->query("SELECT COUNT(*) FROM marketplace_products")->fetchColumn();

    // Orders
    $order_stats = $pdo->query("
        SELECT 
            COUNT(*) as total_orders,
            SUM(amount) as total_revenue
        FROM marketplace_orders
    ")->fetch(PDO::FETCH_ASSOC);

    // 2. Get Trends (Last 30 Days)
    $trends = [];
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $trends[$date] = [
            'date' => date('M d', strtotime($date)),
            'users' => 0,
            'experts' => 0,
            'orders' => 0
        ];
    }

    // User/Expert registrations trend
    $reg_trends = $pdo->query("
        SELECT DATE(created_at) as date, role, COUNT(*) as count
        FROM marketplace_users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at), role
    ")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reg_trends as $row) {
        if (isset($trends[$row['date']])) {
            if ($row['role'] === 'user') $trends[$row['date']]['users'] = (int)$row['count'];
            if ($row['role'] === 'expert') $trends[$row['date']]['experts'] = (int)$row['count'];
        }
    }

    // Order trend
    $order_trends = $pdo->query("
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM marketplace_orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
    ")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($order_trends as $row) {
        if (isset($trends[$row['date']])) {
            $trends[$row['date']]['orders'] = (int)$row['count'];
        }
    }

    echo json_encode([
        'status' => 'success',
        'counts' => [
            'total_experts' => (int)$expert_stats['total_experts'],
            'pending_experts' => (int)$expert_stats['pending_experts'],
            'total_users' => (int)$user_count,
            'total_products' => (int)$product_count,
            'total_orders' => (int)$order_stats['total_orders'],
            'total_revenue' => (float)$order_stats['total_revenue']
        ],
        'trends' => array_values($trends)
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
