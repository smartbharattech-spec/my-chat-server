<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE marketplace_order_items ADD COLUMN product_type VARCHAR(50) DEFAULT 'product'");
    echo "Column added successfully to marketplace_order_items\n";
} catch (Exception $e) {
    echo "Error adding column: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN product_type VARCHAR(50) DEFAULT 'product'");
    echo "Column added successfully to marketplace_orders\n";
} catch (Exception $e) {
    echo "Error adding column: " . $e->getMessage() . "\n";
}
?>
