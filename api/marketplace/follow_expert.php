<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$expert_id = isset($_POST['expert_id']) ? (int)$_POST['expert_id'] : 0;
$action = isset($_POST['action']) ? $_POST['action'] : 'follow'; // 'follow' or 'unfollow'

if (!$user_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and Expert ID are required.']);
    exit;
}

try {
    if ($action === 'follow') {
        $stmt = $pdo->prepare("INSERT IGNORE INTO marketplace_follows (user_id, expert_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $expert_id]);
        echo json_encode(['status' => 'success', 'message' => 'Followed successfully.']);
    } else {
        $stmt = $pdo->prepare("DELETE FROM marketplace_follows WHERE user_id = ? AND expert_id = ?");
        $stmt->execute([$user_id, $expert_id]);
        echo json_encode(['status' => 'success', 'message' => 'Unfollowed successfully.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
