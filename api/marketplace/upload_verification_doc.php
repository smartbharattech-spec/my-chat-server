<?php
header('Content-Type: application/json');
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No document uploaded.']);
    exit;
}

$uploadDir = 'uploads/verification/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileExtension = pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION);
$fileName = 'verify_' . $user_id . '_' . time() . '.' . $fileExtension;
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($_FILES['document']['tmp_name'], $targetPath)) {
    try {
        $stmt = $pdo->prepare("UPDATE expert_profiles SET verification_document = ?, is_verified = 0 WHERE user_id = ?");
        $stmt->execute([$targetPath, $user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Document uploaded for verification. Admin will review it soon.',
            'document_path' => $targetPath
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file.']);
}
?>
