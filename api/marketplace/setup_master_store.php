<?php
require_once __DIR__ . '/../config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS marketplace_expert_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_import` (expert_id, product_id),
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE
    );";

    $pdo->exec($sql);

    echo json_encode([
        "status" => "success",
        "message" => "marketplace_expert_imports table created/verified successfully!"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to create table: " . $e->getMessage()
    ]);
}
?>
