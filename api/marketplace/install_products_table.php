<?php
require_once __DIR__ . '/../config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS marketplace_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        image_url VARCHAR(500),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    );";

    $pdo->exec($sql);

    echo json_encode([
        "status" => "success",
        "message" => "marketplace_products table created successfully!"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to create table: " . $e->getMessage()
    ]);
}
