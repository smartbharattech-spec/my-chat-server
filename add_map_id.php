<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE payments ADD COLUMN map_request_id INT NULL AFTER project_id");
    echo "Column map_request_id added successfully.\n";
} catch (PDOException $e) {
    echo "Error or column already exists: " . $e->getMessage() . "\n";
}
?>