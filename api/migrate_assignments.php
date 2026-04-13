<?php
require_once 'config.php';

header("Content-Type: application/json");

try {
    // 1. Add 'assigned_admin_id'
    $pdo->exec("ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_admin_id INT(11) DEFAULT NULL");

    // 2. Add 'followup_status'
    $pdo->exec("ALTER TABLE projects ADD COLUMN IF NOT EXISTS followup_status ENUM('none', 'pending', 'accepted', 'rejected') DEFAULT 'none'");

    // 3. Add 'followup_accepted_at'
    $pdo->exec("ALTER TABLE projects ADD COLUMN IF NOT EXISTS followup_accepted_at TIMESTAMP NULL DEFAULT NULL");

    echo json_encode([
        "status" => "success",
        "message" => "Migration successful. Assignment columns added to projects table."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Migration failed: " . $e->getMessage()
    ]);
}
?>