<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

try {
    // 1. Add community settings to expert_profiles
    $sql = "ALTER TABLE expert_profiles 
            ADD COLUMN IF NOT EXISTS community_type ENUM('free', 'paid') DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS community_fee DECIMAL(10, 2) DEFAULT 0.00";
    $pdo->exec($sql);

    // 2. Create Community Memberships table
    $sql = "CREATE TABLE IF NOT EXISTS community_memberships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        expert_id INT NOT NULL,
        fee_paid DECIMAL(10, 2) DEFAULT 0.00,
        status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_membership (user_id, expert_id),
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);

    echo json_encode(['status' => 'success', 'message' => 'Community membership tables and columns added.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
