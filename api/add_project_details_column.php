<?php
require_once 'config.php';

try {
    echo "Starting Database Migration...\n";

    // 1. Add `project_details` to `payments` table
    try {
        $pdo->exec("ALTER TABLE payments ADD COLUMN project_details TEXT DEFAULT NULL AFTER purchase_type");
        echo "✅ Added `project_details` column to `payments` table.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false) {
            echo "ℹ️ Column `project_details` already exists in `payments` table.\n";
        } else {
            echo "❌ Error adding `project_details` to `payments`: " . $e->getMessage() . "\n";
        }
    }

    // 2. Add `plan_id` to `projects` table
    try {
        $pdo->exec("ALTER TABLE projects ADD COLUMN plan_id INT DEFAULT NULL AFTER plan_name");
        echo "✅ Added `plan_id` column to `projects` table.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column") !== false) {
            echo "ℹ️ Column `plan_id` already exists in `projects` table.\n";
        } else {
            echo "❌ Error adding `plan_id` to `projects`: " . $e->getMessage() . "\n";
        }
    }

    echo "Migration Completed.\n";

} catch (PDOException $e) {
    echo "Critical Error: " . $e->getMessage();
}
?>