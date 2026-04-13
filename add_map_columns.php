<?php
require 'api/config.php';

try {
    $sql = "ALTER TABLE map_requests ADD COLUMN city VARCHAR(100) AFTER contact_number, ADD COLUMN state VARCHAR(100) AFTER city";
    $pdo->exec($sql);
    echo "Columns city and state added successfully.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Columns already exist.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>