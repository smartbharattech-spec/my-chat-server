<?php
require_once '../config.php';

try {
    // 1. Alter marketplace_products
    $pdo->exec("ALTER TABLE marketplace_products 
                ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'physical',
                ADD COLUMN IF NOT EXISTS attributes JSON,
                ADD COLUMN IF NOT EXISTS bulk_pricing JSON,
                ADD COLUMN IF NOT EXISTS is_super_profile TINYINT(1) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
                ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5,
                ADD COLUMN IF NOT EXISTS manage_stock TINYINT(1) DEFAULT 0");
    echo "Updated marketplace_products.\n";

    // 2. Create marketplace_orders if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )");

    // Add shipping, billing, coupons
    $pdo->exec("ALTER TABLE marketplace_orders 
                ADD COLUMN IF NOT EXISTS shipping_address JSON,
                ADD COLUMN IF NOT EXISTS billing_address JSON,
                ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
                ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00");
    echo "Updated marketplace_orders.\n";

    // 3. Create marketplace_order_items if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        expert_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )");

    // Add selected attributes
    $pdo->exec("ALTER TABLE marketplace_order_items 
                ADD COLUMN IF NOT EXISTS selected_attributes JSON");
    echo "Updated marketplace_order_items.\n";

    // 4. Create Coupons Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        max_uses INT DEFAULT 0,
        current_uses INT DEFAULT 0,
        valid_until DATETIME,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )");
    echo "Created marketplace_coupons.\n";

    echo "Database setup complete.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
