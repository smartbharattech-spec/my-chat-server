<?php
require_once '../config.php';

try {
    $pdo->exec("ALTER TABLE occult_tracker_guidance ADD COLUMN product_ids TEXT DEFAULT NULL AFTER expert_comment");
    echo json_encode(['status' => 'success', 'message' => 'Table updated successfully']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
