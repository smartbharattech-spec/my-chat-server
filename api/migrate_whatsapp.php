<?php
require_once 'config.php';

try {
    // Check if column exists first
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'whatsapp'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN whatsapp VARCHAR(20) AFTER mobile");
        echo json_encode(["status" => "success", "message" => "Column 'whatsapp' added successfully."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'whatsapp' already exists."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Migration failed: " . $e->getMessage()]);
}
?>
