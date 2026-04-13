<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

try {
    $sql = "ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS gst_enabled TINYINT(1) DEFAULT 1";
    $pdo->exec($sql);
    echo json_encode(['status' => 'success', 'message' => 'Added gst_enabled column to marketplace_products.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
