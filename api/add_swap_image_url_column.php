<?php
include_once 'config.php';

global $pdo;

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM plans LIKE 'swap_image_url'");
    $exists = $stmt->fetch();

    if (!$exists) {
        // Add column
        $pdo->exec("ALTER TABLE plans ADD COLUMN swap_image_url VARCHAR(255) DEFAULT NULL AFTER image_swap");
        echo json_encode(["status" => "success", "message" => "Column 'swap_image_url' added successfully."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'swap_image_url' already exists."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>