<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$post_id = isset($_GET['post_id']) ? (int)$_GET['post_id'] : 0;

if (!$post_id) {
    echo json_encode(['status' => 'error', 'message' => 'Post ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT c.*, u.name as user_name, ep.profile_image as user_image
        FROM community_comments c
        JOIN marketplace_users u ON c.user_id = u.id
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    ");
    $stmt->execute([$post_id]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $comments]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
