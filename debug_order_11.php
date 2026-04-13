<?php
require_once 'api/config.php';

try {
    echo "--- Order 11 Header ---\n";
    $stmt = $pdo->prepare("SELECT id, product_id, amount, status FROM marketplace_orders WHERE id = 11");
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    print_r($order);

    echo "\n--- Order 11 Items ---\n";
    $stmt = $pdo->prepare("SELECT id, order_id, product_id, selected_attributes FROM marketplace_order_items WHERE order_id = 11");
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($items);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
