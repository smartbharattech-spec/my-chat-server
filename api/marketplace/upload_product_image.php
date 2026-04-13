<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Create uploads directory if it doesn't exist
$uploadDir = '../../uploads/products/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$expert_id = isset($_POST['expert_id']) ? (int)$_POST['expert_id'] : 0;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
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
$filename = 'prod_' . $expert_id . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $filename;
$publicPath = 'uploads/products/' . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Also ensure permissions are set correctly for XAMPP/Windows
    chmod($targetPath, 0644);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Product image uploaded successfully',
        'path' => $publicPath,
        'filename' => $filename
    ]);
} else {
    $error = error_get_last();
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file. ' . ($error['message'] ?? '')]);
}
?>
