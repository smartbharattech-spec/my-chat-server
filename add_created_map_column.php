<?php
require_once 'api/config.php';

try {
    $sql = "ALTER TABLE map_requests ADD COLUMN created_map VARCHAR(255) DEFAULT NULL AFTER status";
    $pdo->exec($sql);
    echo "Column 'created_map' added successfully to 'map_requests' table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'created_map' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
