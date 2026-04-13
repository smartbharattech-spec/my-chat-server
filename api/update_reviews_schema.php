<?php
require_once 'config.php';
try {
    $pdo->exec("ALTER TABLE reviews ADD COLUMN remedy_name VARCHAR(255) DEFAULT NULL, ADD COLUMN sentiment ENUM('Positive', 'Negative') DEFAULT 'Positive'");
    echo json_encode(["status" => "success", "message" => "Reviews table updated"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>