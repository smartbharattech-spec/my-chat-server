<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

try {
    $sql = "ALTER TABLE expert_profiles ADD COLUMN is_visible TINYINT(1) DEFAULT 0 AFTER is_verified";
    $pdo->exec($sql);
    echo "Column is_visible added successfully.\n";
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "Column is_visible already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
