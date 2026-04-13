<?php
require_once '../config.php';
header('Content-Type: application/json');

$results = [];

try {
    // 1. Add 'credits' column to 'marketplace_users'
    try {
        $pdo->exec("ALTER TABLE marketplace_users ADD COLUMN credits INT DEFAULT 0 AFTER status");
        $results[] = "Added 'credits' column to marketplace_users.";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            $results[] = "'credits' column already exists.";
        } else {
            throw $e;
        }
    }

    // 2. Add 'credits_per_message' to 'marketplace_settings'
    try {
        $pdo->exec("INSERT INTO marketplace_settings (setting_key, setting_value) VALUES ('credits_per_message', '1')");
        $results[] = "Added 'credits_per_message' setting.";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            $results[] = "'credits_per_message' setting already exists.";
        } else {
            throw $e;
        }
    }

    echo json_encode(['status' => 'success', 'messages' => $results]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
