<?php
require_once 'config.php';

try {
    echo "Starting migration...<br>";

    // Add file_path column to chat_messages
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'file_path'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE chat_messages ADD COLUMN file_path VARCHAR(500) DEFAULT NULL AFTER message");
        echo "Column 'file_path' added to chat_messages.<br>";
    } else {
        echo "Column 'file_path' already exists.<br>";
    }

    echo "<strong>Migration completed successfully.</strong>";
} catch (Exception $e) {
    echo "<strong>Error:</strong> " . $e->getMessage();
}
