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
    // Verify user belongs to this conversation or follows the expert for broadcast
    $verifyStmt = $pdo->prepare("SELECT id, type, expert_id FROM chat_conversations WHERE id = ?");
    $verifyStmt->execute([$conversation_id]);
    $conv = $verifyStmt->fetch();

    if (!$conv) {
        echo json_encode(['status' => 'error', 'message' => 'Conversation not found.']);
        exit;
    }

    $isAuthorized = false;
    if ($conv['type'] === 'broadcast') {
        // For broadcast: Authorize if user is the expert OR is a follower
        if ((int)$conv['expert_id'] === $user_id) {
            $isAuthorized = true;
        } else {
            $followStmt = $pdo->prepare("SELECT user_id FROM marketplace_follows WHERE user_id = ? AND expert_id = ?");
            $followStmt->execute([$user_id, $conv['expert_id']]);
            if ($followStmt->fetch()) {
                $isAuthorized = true;
            }
        }
    } else {
        // For private: Authorize if user is either participant
        // Get the full conv data to check both columns
        $fullConvStmt = $pdo->prepare("SELECT id FROM chat_conversations WHERE id = ? AND (user_id = ? OR expert_id = ?)");
        $fullConvStmt->execute([$conversation_id, $user_id, $user_id]);
        if ($fullConvStmt->fetch()) {
            $isAuthorized = true;
        }
    }

    if (!$isAuthorized) {
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
