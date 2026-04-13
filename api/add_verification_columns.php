<?php
require_once 'config.php';

try {
    // Add verification_token column
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'verification_token'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN verification_token VARCHAR(64) DEFAULT NULL AFTER whatsapp");
        echo "Added verification_token column.<br>";
    } else {
        echo "verification_token column already exists.<br>";
    }

    // Add is_verified column
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_verified'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER verification_token");
        echo "Added is_verified column.<br>";
    } else {
        echo "is_verified column already exists.<br>";
    }

    echo "Database schema updated successfully.";

} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>