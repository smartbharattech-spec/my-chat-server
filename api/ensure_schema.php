<?php
require_once 'config.php';

try {
    // 1. Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM user_property_details LIKE 'project_id'");
    $columnExists = $stmt->fetch();

    if (!$columnExists) {
        echo "Adding project_id column to user_property_details...<br>";
        $pdo->exec("ALTER TABLE user_property_details ADD COLUMN project_id INT NULL AFTER email");
        echo "Column project_id added.<br>";
    } else {
        echo "Column project_id already exists.<br>";
    }

    // 2. Check if index exists
    $stmt = $pdo->query("SHOW INDEX FROM user_property_details WHERE Key_name = 'idx_project_id'");
    $indexExists = $stmt->fetch();

    if (!$indexExists) {
        echo "Adding index idx_project_id...<br>";
        $pdo->exec("CREATE INDEX idx_project_id ON user_property_details(project_id)");
        echo "Index added.<br>";
    } else {
        echo "Index idx_project_id already exists.<br>";
    }

    echo "<strong>Schema check completed successfully.</strong>";
} catch (Exception $e) {
    echo "<strong>Error:</strong> " . $e->getMessage();
}
?>
