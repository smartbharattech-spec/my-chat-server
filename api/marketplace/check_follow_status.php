<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$user_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and Expert ID are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM marketplace_follows WHERE user_id = ? AND expert_id = ?");
    $stmt->execute([$user_id, $expert_id]);
    $is_following = $stmt->fetchColumn() > 0;

    echo json_encode(['status' => 'success', 'is_following' => $is_following]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
