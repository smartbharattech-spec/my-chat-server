<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    // Set is_online to FALSE (0) on logout
    $stmt = $pdo->prepare("UPDATE marketplace_users SET is_online = 0 WHERE id = ?");
    $stmt->execute([$user_id]);

    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
