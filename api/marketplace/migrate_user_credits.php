<?php
header('Content-Type: application/json');
require_once '../config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM marketplace_users LIKE 'credits'");
    $column = $stmt->fetch();

    if (!$column) {
        $pdo->exec("ALTER TABLE marketplace_users ADD COLUMN credits INT DEFAULT 0 AFTER status");
        echo json_encode(['status' => 'success', 'message' => 'Credits column added successfully.']);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Credits column already exists.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
