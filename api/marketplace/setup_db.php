<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    // 1. Marketplace Orders table
    $sql = "CREATE TABLE IF NOT EXISTS marketplace_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        expert_id INT NOT NULL,
        product_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'on_hold') DEFAULT 'pending',
        payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id),
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id),
        FOREIGN KEY (product_id) REFERENCES marketplace_products(id)
    )";
    $pdo->exec($sql);

    // 2. Expert Wallets table
    $sql = "CREATE TABLE IF NOT EXISTS expert_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL UNIQUE,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        total_earned DECIMAL(10, 2) DEFAULT 0.00,
        total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id)
    )";
    $pdo->exec($sql);

    // 3. Wallet Transactions table
    $sql = "CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wallet_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        order_id INT DEFAULT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES expert_wallets(id),
        FOREIGN KEY (order_id) REFERENCES marketplace_orders(id)
    )";
    $pdo->exec($sql);

    echo json_encode(['status' => 'success', 'message' => 'Database tables created successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
