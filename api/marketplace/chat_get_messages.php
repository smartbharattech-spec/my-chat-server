<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$conversation_id = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;

if (!$conversation_id || !$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Conversation ID and User ID are required.']);
    exit;
}

try {
    // Verify user belongs to this conversation
    $verifyStmt = $pdo->prepare("SELECT id FROM chat_conversations WHERE id = ? AND (user_id = ? OR expert_id = ?)");
    $verifyStmt->execute([$conversation_id, $user_id, $user_id]);
    if (!$verifyStmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized access to conversation.']);
        exit;
    }

    // Fetch messages
    $stmt = $pdo->prepare("SELECT m.*, u.name as sender_name 
                           FROM chat_messages m 
                           JOIN marketplace_users u ON m.sender_id = u.id 
                           WHERE m.conversation_id = ? 
                           ORDER BY m.created_at ASC");
    $stmt->execute([$conversation_id]);
    $messages = $stmt->fetchAll();

    // Mark as read for the current user (if sender is NOT the current user)
    $updateStmt = $pdo->prepare("UPDATE chat_messages SET is_read = 1 
                                 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0");
    $updateStmt->execute([$conversation_id, $user_id]);

    echo json_encode([
        'status' => 'success',
        'data' => $messages
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
