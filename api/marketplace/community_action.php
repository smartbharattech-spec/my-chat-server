<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$post_id = isset($_POST['post_id']) ? (int)$_POST['post_id'] : 0;
$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$action = isset($_POST['action']) ? $_POST['action'] : ''; // 'like', 'share'

if (!$post_id || !$user_id || empty($action)) {
    echo json_encode(['status' => 'error', 'message' => 'Post ID, User ID, and Action are required.']);
    exit;
}

try {
    if ($action === 'like') {
        // Toggle Like
        $stmtCheck = $pdo->prepare("SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?");
        $stmtCheck->execute([$post_id, $user_id]);
        $like = $stmtCheck->fetch();

        if ($like) {
            // Unlike
            $pdo->prepare("DELETE FROM community_likes WHERE id = ?")->execute([$like['id']]);
            $pdo->prepare("UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?")->execute([$post_id]);
            $is_liked = false;
        } else {
            // Like
            $pdo->prepare("INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)")->execute([$post_id, $user_id]);
            $pdo->prepare("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$post_id]);
            $is_liked = true;
        }

        // Get updated count
        $stmtCount = $pdo->prepare("SELECT likes_count FROM community_posts WHERE id = ?");
        $stmtCount->execute([$post_id]);
        $count = $stmtCount->fetchColumn();

        echo json_encode(['status' => 'success', 'message' => 'Like toggled', 'count' => $count, 'is_liked' => $is_liked]);
    } elseif ($action === 'share') {
        // Increment share count
        $pdo->prepare("UPDATE community_posts SET shares_count = shares_count + 1 WHERE id = ?")->execute([$post_id]);
        
        // Get updated count
        $stmtCount = $pdo->prepare("SELECT shares_count FROM community_posts WHERE id = ?");
        $stmtCount->execute([$post_id]);
        $count = $stmtCount->fetchColumn();

        echo json_encode(['status' => 'success', 'message' => 'Share count updated', 'count' => $count]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
