<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    // 1. Create marketplace_expert_imports table
    $pdo->exec("CREATE TABLE IF NOT EXISTS marketplace_expert_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_import (expert_id, product_id),
        CONSTRAINT fk_expert FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
        CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE
    )");

    echo json_encode([
        'status' => 'success',
        'message' => 'Table marketplace_expert_imports created successfully (or already exists).'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
