<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$role = isset($input['role']) ? $input['role'] : ''; // 'user' or 'expert'

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    // Fetch conversations with the other party's details
    if ($role === 'expert') {
        $sql = "SELECT c.*, u.name as other_party_name, u.role as other_party_role 
                FROM chat_conversations c 
                JOIN marketplace_users u ON c.user_id = u.id 
                WHERE c.expert_id = ? 
                ORDER BY c.last_message_time DESC";
    } else {
        $sql = "SELECT c.*, u.name as other_party_name, u.role as other_party_role 
                FROM chat_conversations c 
                JOIN marketplace_users u ON c.expert_id = u.id 
                WHERE c.user_id = ? 
                ORDER BY c.last_message_time DESC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $conversations = $stmt->fetchAll();

    // Add unread count for each conversation
    foreach ($conversations as &$conv) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) as unread_count 
                                    FROM chat_messages 
                                    WHERE conversation_id = ? AND sender_id != ? AND is_read = 0");
        $countStmt->execute([$conv['id'], $user_id]);
        $result = $countStmt->fetch();
        $conv['unread_count'] = (int)$result['unread_count'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $conversations
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
