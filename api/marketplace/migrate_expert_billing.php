<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

try {
    // 1. Create expert_billing_settings table
    $sql = "CREATE TABLE IF NOT EXISTS expert_billing_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_type ENUM('product_sale', 'chat_message', 'community_join') NOT NULL UNIQUE,
        charge_type ENUM('percentage', 'fixed') NOT NULL,
        charge_value DECIMAL(10, 2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);

    // Initial seed for settings if not exist
    $pdo->exec("INSERT IGNORE INTO expert_billing_settings (activity_type, charge_type, charge_value) VALUES 
        ('product_sale', 'percentage', 10.00),
        ('chat_message', 'fixed', 1.00),
        ('community_join', 'percentage', 10.00)");

    // 2. Create expert_bills table
    $sql = "CREATE TABLE IF NOT EXISTS expert_bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        activity_type ENUM('product_sale', 'chat_message', 'community_join') NOT NULL,
        reference_id INT NOT NULL,
        status ENUM('pending', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);

    // 3. Add blocking columns to marketplace_users
    $sql = "ALTER TABLE marketplace_users 
            ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS block_reason VARCHAR(255) DEFAULT NULL";
    $pdo->exec($sql);

    echo json_encode(['status' => 'success', 'message' => 'Expert billing migration completed successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
