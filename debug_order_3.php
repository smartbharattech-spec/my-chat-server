<?php
require_once 'api/config.php';

try {
    echo "--- Order 3 Header ---\n";
    $stmt = $pdo->prepare("SELECT id, product_id, amount, status, created_at FROM marketplace_orders WHERE id = 3");
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    print_r($order);

    echo "\n--- Order 3 Items ---\n";
    $stmt = $pdo->prepare("SELECT id, order_id, product_id, selected_attributes FROM marketplace_order_items WHERE order_id = 3");
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($items);

    echo "\n--- Recent Orders ---\n";
    $stmt = $pdo->query("SELECT id, product_id, created_at FROM marketplace_orders ORDER BY id DESC LIMIT 5");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
