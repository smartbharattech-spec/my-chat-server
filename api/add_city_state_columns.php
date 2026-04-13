<?php
require_once 'api/config.php';

try {
    $sql = "ALTER TABLE users 
            ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER whatsapp,
            ADD COLUMN state VARCHAR(100) DEFAULT NULL AFTER city";
    
    $pdo->exec($sql);
    echo "Successfully added city and state columns to users table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Columns city and/or state already exist in users table.\n";
    } else {
        echo "Error adding columns: " . $e->getMessage() . "\n";
    }
}
?>
