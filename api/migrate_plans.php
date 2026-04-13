<?php
require_once 'config.php';

header("Content-Type: application/json");

try {
    // 1. Update 'plans' table
    $pdo->exec("ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_type ENUM('single', 'subscription') DEFAULT 'single'");
    $pdo->exec("ALTER TABLE plans ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 0");

    // 2. Update 'users' table
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id INT DEFAULT NULL");
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expiry DATETIME DEFAULT NULL");
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_activated_at DATETIME DEFAULT NULL");

    echo json_encode([
        "status" => "success",
        "message" => "Database migration for flexible plans successful."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Migration failed: " . $e->getMessage()
    ]);
}
?>