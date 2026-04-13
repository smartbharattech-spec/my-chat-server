<?php
require_once 'config.php';
try {
    $pdo->exec("ALTER TABLE projects ADD COLUMN IF NOT EXISTS followup_start_at TIMESTAMP NULL DEFAULT NULL");
    echo "Success: followup_start_at column added.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>