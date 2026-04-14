<?php
header('Content-Type: application/json');
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded or upload error']);
    exit;
}

$uploadDir = '../../uploads/chat/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = time() . '_' . basename($_FILES['file']['name']);
$targetPath = $uploadDir . $fileName;
$fileType = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));

// Allow certain file formats
$allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'pdf');
if (in_array($fileType, $allowTypes)) {
    if (move_uploaded_file($_FILES['file']['tmp_id'], $targetPath)) {
        // Fallback for some systems where tmp_id is used instead of tmp_name in my thought process? 
        // No, it's tmp_name. 
    }
    
    // Fixed move_uploaded_file
    if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        $fileUrl = '/uploads/chat/' . $fileName;
        echo json_encode([
            'status' => 'success',
            'data' => [
                'file_url' => $fileUrl,
                'file_name' => $fileName,
                'file_type' => $fileType
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type.']);
}
