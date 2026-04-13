<?php
require 'config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_consultant'");
    $result = $stmt->fetch();

    if (!$result) {
        // Add column if it doesn't exist
        $sql = "ALTER TABLE users ADD COLUMN is_consultant TINYINT(1) DEFAULT 0 AFTER is_verified";
        $pdo->exec($sql);
        echo "Column 'is_consultant' added successfully.";
    } else {
        echo "Column 'is_consultant' already exists.";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>