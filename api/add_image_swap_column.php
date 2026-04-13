<?php
include_once 'config.php';

global $pdo;

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM plans LIKE 'image_swap'");
    $exists = $stmt->fetch();

    if (!$exists) {
        // Add column
        $pdo->exec("ALTER TABLE plans ADD COLUMN image_swap TINYINT(1) DEFAULT 0 AFTER allowed_tools");
        echo json_encode(["status" => "success", "message" => "Column 'image_swap' added successfully."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'image_swap' already exists."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>