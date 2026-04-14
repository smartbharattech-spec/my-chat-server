<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$conversation_id = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$title = isset($input['title']) ? trim($input['title']) : '';

if (!$conversation_id || !$user_id || empty($title)) {
    echo json_encode(['status' => 'error', 'message' => 'Conversation ID, User ID, and Title are required.']);
    exit;
}

try {
    // Verify user is the expert of this broadcast room
    $stmt = $pdo->prepare("SELECT id FROM chat_conversations WHERE id = ? AND expert_id = ? AND type = 'broadcast'");
    $stmt->execute([$conversation_id, $user_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized or only broadcast groups can be renamed by the expert.']);
        exit;
    }

    // Update title
    $stmt = $pdo->prepare("UPDATE chat_conversations SET title = ? WHERE id = ?");
    $stmt->execute([$title, $conversation_id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Conversation title updated successfully.'
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
