<?php
require 'api/config.php';

try {
    $pdo->exec("ALTER TABLE community_posts ADD COLUMN video_url VARCHAR(500) DEFAULT NULL AFTER image_url");
    echo json_encode(['status' => 'success', 'message' => 'Database schema updated successfully']);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(['status' => 'success', 'message' => 'Column video_url already exists']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
