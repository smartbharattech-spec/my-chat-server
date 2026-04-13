<?php
require_once __DIR__ . '/../config.php';

try {
    // Add transaction_id if it doesn't exist
    $sql = "ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) AFTER id";
    $pdo->exec($sql);

    echo json_encode(["status" => "success", "message" => "Database updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to update database: " . $e->getMessage()]);
}
?>
