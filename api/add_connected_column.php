<?php
require_once 'config.php';

try {
    // Check if column exists
    $check = $pdo->query("SHOW COLUMNS FROM entrance_remedies LIKE 'is_connected_area'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE entrance_remedies ADD COLUMN is_connected_area BOOLEAN DEFAULT FALSE";
        $pdo->exec($sql);
        echo "Column 'is_connected_area' added successfully.";
    } else {
        echo "Column 'is_connected_area' already exists.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
