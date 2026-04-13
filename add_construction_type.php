<?php
require_once 'api/config.php';

try {
    $sql = "ALTER TABLE projects ADD COLUMN construction_type VARCHAR(50) DEFAULT 'Existing' AFTER project_name";
    $pdo->exec($sql);
    echo "Column 'construction_type' added successfully.\n";
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "Column 'construction_type' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
