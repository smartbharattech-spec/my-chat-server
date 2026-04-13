<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(255) NULL AFTER id");
    echo "Column transaction_id added successfully.\n";
} catch (PDOException $e) {
    echo "Error or column already exists: " . $e->getMessage() . "\n";
}
?>