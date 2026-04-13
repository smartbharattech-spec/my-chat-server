<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT credits FROM marketplace_users WHERE id = ? AND role = 'user'");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if ($user !== false) {
        echo json_encode(['status' => 'success', 'credits' => (int)$user['credits']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
