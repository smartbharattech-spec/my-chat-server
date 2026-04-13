<?php
require_once __DIR__ . '/../config.php';

try {
    // 1. Check if it exists now
    $stmt = $pdo->query("SELECT * FROM expert_billing_settings WHERE activity_type = 'creator_commission'");
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Debug recent orders and their commission status
    $stmt = $pdo->query("SELECT id, expert_id, product_id, amount, status, payment_status, created_at FROM marketplace_orders ORDER BY id DESC LIMIT 5");
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Transactions check
    $stmt = $pdo->query("SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 10");
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "setting" => $setting,
        "recent_orders" => $orders,
        "recent_transactions" => $transactions
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
