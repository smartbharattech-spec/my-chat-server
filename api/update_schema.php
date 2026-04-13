<?php
require_once 'config.php';
try {
    $pdo->exec("ALTER TABLE user_property_details ADD COLUMN project_id INT NULL AFTER email");
    $pdo->exec("CREATE INDEX idx_project_id ON user_property_details(project_id)");
    echo "Column project_id added successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
