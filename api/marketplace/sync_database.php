<?php
require_once '../config.php';

// Disable JSON header for this script to show plain text output
define('NO_JSON_HEADER', true);
header('Content-Type: text/plain');

echo "Starting Marketplace Database Sync / Migration...\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "-------------------------------------------\n\n";

try {
    // 1. Create marketplace_products if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        image_url VARCHAR(500),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "[OK] table 'marketplace_products' ensured.\n";

    // 2. Ensure all columns in marketplace_products (including GST and new Ecommerce fields)
    $columns_to_add = [
        "product_type VARCHAR(50) DEFAULT 'physical'",
        "attributes JSON",
        "bulk_pricing JSON",
        "images JSON",
        "is_super_profile TINYINT(1) DEFAULT 0",
        "stock_quantity INT DEFAULT 0",
        "low_stock_threshold INT DEFAULT 5",
        "manage_stock TINYINT(1) DEFAULT 0",
        "base_price DECIMAL(10, 2) DEFAULT 0.00",
        "gst_rate DECIMAL(5, 2) DEFAULT 18.00",
        "gst_amount DECIMAL(10, 2) DEFAULT 0.00",
        "total_price DECIMAL(10, 2) DEFAULT 0.00"
    ];

    foreach ($columns_to_add as $col) {
        $parts = explode(' ', trim($col));
        $col_name = $parts[0];
        try {
            $pdo->exec("ALTER TABLE marketplace_products ADD COLUMN $col");
            echo "[DONE] Added column '$col_name' to marketplace_products.\n";
        } catch (PDOException $e) {
            // Probably already exists
            echo "[SKIP] Column '$col_name' already exists or other issue.\n";
        }
    }

    // 3. Create marketplace_expert_imports if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_expert_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_import (expert_id, product_id)
    )");
    echo "[OK] table 'marketplace_expert_imports' ensured.\n";

    // 4. Ensure expert_profiles has ecommerce toggle
    try {
        $pdo->exec("ALTER TABLE expert_profiles ADD COLUMN is_ecommerce_enabled TINYINT(1) DEFAULT 0");
        echo "[DONE] Added column 'is_ecommerce_enabled' to expert_profiles.\n";
    } catch (PDOException $e) {
        echo "[SKIP] Column 'is_ecommerce_enabled' in expert_profiles already exists.\n";
    }

    // 5. Data Cleanup: Ensure base_price and total_price are synced for old products
    $pdo->exec("UPDATE marketplace_products SET base_price = price, total_price = price * 1.18, gst_amount = price * 0.18 WHERE base_price = 0 AND price > 0");
    echo "[OK] Initialized GST prices for existing products.\n";

    echo "\n-------------------------------------------\n";
    echo "SUCCESS: Migration completed. Your live database is now synced with the latest marketplace features.\n";
    echo "You can now delete this file for security.";

} catch (PDOException $e) {
    echo "\n-------------------------------------------\n";
    echo "FATAL ERROR during migration: " . $e->getMessage() . "\n";
    echo "Please check your database permissions.";
}
?>
