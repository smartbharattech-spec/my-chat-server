<?php
require_once '../config.php';

try {
    // 1. Update marketplace_products
    $pdo->exec("ALTER TABLE marketplace_products 
                ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) DEFAULT 0.00,
                ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 18.00,
                ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00,
                ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0.00");
    
    // Copy existing price to base_price and total_price for existing products
    $pdo->exec("UPDATE marketplace_products SET base_price = price, total_price = price * 1.18, gst_amount = price * 0.18 WHERE base_price = 0 AND price > 0");
    
    echo "Updated marketplace_products with GST columns.\n";

    // 2. Update marketplace_orders
    $pdo->exec("ALTER TABLE marketplace_orders 
                ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0.00,
                ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00");
    echo "Updated marketplace_orders with GST columns.\n";

    // 3. Update marketplace_order_items
    $pdo->exec("ALTER TABLE marketplace_order_items 
                ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) DEFAULT 0.00,
                ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00");
    echo "Updated marketplace_order_items with GST columns.\n";

    echo "Database migration for GST complete.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
