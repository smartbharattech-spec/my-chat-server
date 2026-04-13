<?php
require_once '../config.php';

try {
    echo "Starting database migration...\n";

    // 1. Add is_ecommerce_enabled to expert_profiles
    $pdo->exec("ALTER TABLE expert_profiles 
                ADD COLUMN IF NOT EXISTS is_ecommerce_enabled TINYINT(1) DEFAULT 0");
    echo "Added is_ecommerce_enabled to expert_profiles.\n";

    // 2. Ensure marketplace_products has the required columns
    // product_type: 'product', 'service', 'course', 'digital_profile'
    // attributes: JSON for size, weight, color, metal, width, length, qty
    // bulk_pricing: JSON for quantity-based discounts
    // is_super_profile: TINYINT
    $pdo->exec("ALTER TABLE marketplace_products 
                MODIFY COLUMN product_type VARCHAR(50) DEFAULT 'product',
                ADD COLUMN IF NOT EXISTS attributes JSON,
                ADD COLUMN IF NOT EXISTS bulk_pricing JSON,
                ADD COLUMN IF NOT EXISTS is_super_profile TINYINT(1) DEFAULT 0");
    echo "Updated marketplace_products with attributes, bulk_pricing, and is_super_profile columns.\n";

    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
