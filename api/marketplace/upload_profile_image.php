<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Create uploads directory if it doesn't exist
$uploadDir = '../../uploads/profiles/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$type = isset($_POST['type']) ? $_POST['type'] : ''; // 'profile' or 'banner'

if (!$user_id || !in_array($type, ['profile', 'banner'])) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and type (profile/banner) are required.']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No image file uploaded or upload error.']);
    exit;
}

$file = $_FILES['image'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($ext, $allowed)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, and WEBP allowed.']);
    exit;
}

// Generate unique filename
$filename = $type . '_' . $user_id . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $filename;
$publicPath = 'uploads/profiles/' . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    try {
        $column = ($type === 'profile') ? 'profile_image' : 'banner_image';
        $stmt = $pdo->prepare("UPDATE expert_profiles SET $column = ? WHERE user_id = ?");
        $stmt->execute([$publicPath, $user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => ucfirst($type) . ' image uploaded successfully',
            'path' => $publicPath
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file.']);
}
?>
