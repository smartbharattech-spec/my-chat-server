<?php
require_once 'api/config.php';
try {
    $pdo->exec("ALTER TABLE projects ADD COLUMN map_image VARCHAR(255) DEFAULT NULL AFTER plan_id");
    echo "Migration successful: map_image column added.";
} catch (PDOException $e) {
    echo "Error or already exists: " . $e->getMessage();
}
?>