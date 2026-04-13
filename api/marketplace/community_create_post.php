<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config.php';

// Create uploads directory if it doesn't exist
$uploadDir = '../../uploads/community/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$expert_id = isset($_POST['expert_id']) ? (int)$_POST['expert_id'] : 0;
$content = isset($_POST['content']) ? trim($_POST['content']) : '';

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

if (empty($content) && (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) && (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK)) {
    echo json_encode(['status' => 'error', 'message' => 'Content, image, or video is required.']);
    exit;
}

$image_url = null;
$video_url = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['image'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP allowed.']);
        exit;
    }

    // Generate unique filename
    $filename = 'post_' . $expert_id . '_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $filename;
    $image_url = 'uploads/community/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to upload image.']);
        exit;
    }
    chmod($targetPath, 0644);
}

if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['video'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['mp4', 'webm', 'ogg', 'mov'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid video type. Only MP4, WEBM, OGG, and MOV allowed.']);
        exit;
    }

    // Generate unique filename
    $filename = 'post_vid_' . $expert_id . '_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $filename;
    $video_url = 'uploads/community/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to upload video.']);
        exit;
    }
    chmod($targetPath, 0644);
}

try {
    $stmt = $pdo->prepare("INSERT INTO community_posts (expert_id, content, image_url, video_url) VALUES (?, ?, ?, ?)");
    $stmt->execute([$expert_id, $content, $image_url, $video_url]);
    
    $post_id = $pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Post created successfully',
        'data' => [
            'id' => $post_id,
            'expert_id' => $expert_id,
            'content' => $content,
            'image_url' => $image_url,
            'video_url' => $video_url,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
