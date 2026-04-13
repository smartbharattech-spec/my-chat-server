<?php
require_once '../config.php';

try {
    // 1. Create Credit Plans Table
    $createPlansTable = "
    CREATE TABLE IF NOT EXISTS marketplace_credit_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT DEFAULT 0,
        plan_name VARCHAR(100) NOT NULL,
        credits INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($createPlansTable);
    echo "Successfully created marketplace_credit_plans table.\n";

    // 2. Create Credit Requests Table
    $createRequestsTable = "
    CREATE TABLE IF NOT EXISTS marketplace_credit_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        credits INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES marketplace_credit_plans(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($createRequestsTable);
    echo "Successfully created marketplace_credit_requests table.\n";

    echo "Database setup for credit system is complete.\n";

} catch (PDOException $e) {
    echo "Error setting up database: " . $e->getMessage() . "\n";
}
?>
