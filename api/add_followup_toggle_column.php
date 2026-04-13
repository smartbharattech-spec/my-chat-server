<?php
header("Content-Type: application/json");
require_once 'config.php';

try {
    // Add followup_enabled column if it doesn't exist
    $sql = "ALTER TABLE plans ADD COLUMN IF NOT EXISTS followup_enabled TINYINT(1) DEFAULT 0 AFTER is_free";
    $pdo->exec($sql);

    echo json_encode(["status" => "success", "message" => "Database migration for followup_enabled column successful."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>