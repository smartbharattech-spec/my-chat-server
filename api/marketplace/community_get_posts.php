<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$role = isset($_GET['role']) ? $_GET['role'] : 'user'; // 'user', 'expert', 'admin'

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    $posts = [];
    if ($role === 'expert') {
        // Experts see their own posts
        $stmt = $pdo->prepare("
            SELECT p.*, u.name as expert_name, ep.profile_image as expert_image
            FROM community_posts p
            JOIN marketplace_users u ON p.expert_id = u.id
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE p.expert_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$user_id]);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($role === 'admin') {
        // Admins see everything
        $stmt = $pdo->prepare("
            SELECT p.*, u.name as expert_name, ep.profile_image as expert_image
            FROM community_posts p
            JOIN marketplace_users u ON p.expert_id = u.id
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Regular users only see posts from experts whose community they have joined
        $stmt = $pdo->prepare("
            SELECT p.*, u.name as expert_name, ep.profile_image as expert_image
            FROM community_posts p
            JOIN marketplace_users u ON p.expert_id = u.id
            JOIN community_memberships m ON p.expert_id = m.expert_id
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE m.user_id = ? AND m.status = 'active'
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$user_id]);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Combine with base URL for image
    foreach ($posts as &$post) {
        // Fetch comment count
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM community_comments WHERE post_id = ?");
        $stmtCount->execute([$post['id']]);
        $post['comments_count'] = $stmtCount->fetchColumn();

        // Check if current user liked the post
        $stmtLiked = $pdo->prepare("SELECT COUNT(*) FROM community_likes WHERE post_id = ? AND user_id = ?");
        $stmtLiked->execute([$post['id'], $user_id]);
        $post['is_liked'] = $stmtLiked->fetchColumn() > 0;
    }

    echo json_encode(['status' => 'success', 'data' => $posts]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
