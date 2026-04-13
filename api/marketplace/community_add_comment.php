<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$post_id = isset($_POST['post_id']) ? (int)$_POST['post_id'] : 0;
$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$comment = isset($_POST['comment']) ? trim($_POST['comment']) : '';

if (!$post_id || !$user_id || empty($comment)) {
    echo json_encode(['status' => 'error', 'message' => 'Post ID, User ID, and Comment are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO community_comments (post_id, user_id, comment) VALUES (?, ?, ?)");
    $stmt->execute([$post_id, $user_id, $comment]);
    
    $comment_id = $pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Comment added successfully',
        'data' => [
            'id' => $comment_id,
            'post_id' => $post_id,
            'user_id' => $user_id,
            'comment' => $comment,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
