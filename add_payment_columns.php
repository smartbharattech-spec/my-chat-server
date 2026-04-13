<?php
require 'api/config.php';

try {
    // Check if columns exist
    $stmt = $pdo->query("DESCRIBE payments");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $columnsToAdd = [];

    if (!in_array('plan_id', $columns)) {
        $columnsToAdd[] = "ADD COLUMN plan_id INT NULL AFTER plan";
    }
    if (!in_array('credits', $columns)) {
        $columnsToAdd[] = "ADD COLUMN credits INT DEFAULT 0 AFTER price";
    }
    if (!in_array('purchase_type', $columns)) {
        $columnsToAdd[] = "ADD COLUMN purchase_type VARCHAR(50) DEFAULT 'new_purchase' AFTER status";
    }
    if (!in_array('current_plan', $columns)) {
        $columnsToAdd[] = "ADD COLUMN current_plan VARCHAR(255) NULL AFTER purchase_type";
    }
    if (!in_array('current_plan_id', $columns)) {
        $columnsToAdd[] = "ADD COLUMN current_plan_id INT NULL AFTER current_plan";
    }

    if (count($columnsToAdd) > 0) {
        $sql = "ALTER TABLE payments " . implode(", ", $columnsToAdd);
        $pdo->exec($sql);
        echo "Successfully added columns: " . implode(", ", $columnsToAdd) . "\n";
    } else {
        echo "All columns already exist.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>