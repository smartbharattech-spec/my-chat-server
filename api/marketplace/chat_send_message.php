<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$expert_id = isset($input['expert_id']) ? (int)$input['expert_id'] : 0;
$conversation_id = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
$message = isset($input['message']) ? trim($input['message']) : '';

if (!$user_id || (!$expert_id && !$conversation_id) || empty($message)) {
    echo json_encode(['status' => 'error', 'message' => 'Sender ID, Message, and either Expert ID or Conversation ID are required.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 0. Credit Check (Only if user is sending to expert)
    $stmt = $pdo->prepare("SELECT role, credits FROM marketplace_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $sender = $stmt->fetch();

    if ($sender && $sender['role'] === 'user') {
        // Support fetching expert_id from conversation if not provided
        if (!$expert_id && $conversation_id) {
            $stmt = $pdo->prepare("SELECT expert_id FROM chat_conversations WHERE id = ?");
            $stmt->execute([$conversation_id]);
            $conv = $stmt->fetch();
            if ($conv) $expert_id = $conv['expert_id'];
        }

        // 0.1 Check for Free Messages
        $is_free_message = false;
        $expert_free_limit = 0;
        
        if ($expert_id) {
            $stmt = $pdo->prepare("SELECT per_message_charge, free_message_limit FROM expert_profiles WHERE user_id = ?");
            $stmt->execute([$expert_id]);
            $expert_profile = $stmt->fetch();
            
            if ($expert_profile) {
                $expert_free_limit = (int)$expert_profile['free_message_limit'];
                
                // Check how many free messages already used in this conversation
                if ($conversation_id) {
                    $stmt = $pdo->prepare("SELECT free_messages_used FROM chat_conversations WHERE id = ?");
                    $stmt->execute([$conversation_id]);
                    $conv_data = $stmt->fetch();
                    $used = $conv_data ? (int)$conv_data['free_messages_used'] : 0;
                    
                    if ($used < $expert_free_limit) {
                        $is_free_message = true;
                        // Increment free messages used
                        $stmt = $pdo->prepare("UPDATE chat_conversations SET free_messages_used = free_messages_used + 1 WHERE id = ?");
                        $stmt->execute([$conversation_id]);
                    }
                } else {
                    // New conversation, check if we start with free messages
                    if ($expert_free_limit > 0) {
                        $is_free_message = true;
                        // We'll increment this after creating the conversation later in the script
                    }
                }
            }
        }

        if (!$is_free_message) {
            $credits_to_deduct = -1;
            if ($expert_id) {
                if ($expert_profile && $expert_profile['per_message_charge'] !== null) {
                    $credits_to_deduct = (int)$expert_profile['per_message_charge'];
                }
            }

            // Fallback to global setting if no expert-specific charge is set
            if ($credits_to_deduct < 0) {
                $stmt = $pdo->prepare("SELECT setting_value FROM marketplace_settings WHERE setting_key = 'credits_per_message'");
                $stmt->execute();
                $setting = $stmt->fetch();
                $credits_to_deduct = $setting ? (int)$setting['setting_value'] : 1; // Default to 1
            }

            if ($sender['credits'] < $credits_to_deduct) {
                echo json_encode(['status' => 'error', 'message' => "Insufficient credits. Sending a message requires $credits_to_deduct credits."]);
                $pdo->rollBack();
                exit;
            }
            // Deduct credits
            $stmt = $pdo->prepare("UPDATE marketplace_users SET credits = credits - ? WHERE id = ?");
            $stmt->execute([$credits_to_deduct, $user_id]);
        }
    }

    // 1. Get or create conversation
    if (!$conversation_id) {
        $stmt = $pdo->prepare("SELECT id FROM chat_conversations WHERE (user_id = ? AND expert_id = ?) OR (user_id = ? AND expert_id = ?)");
        $stmt->execute([$user_id, $expert_id, $expert_id, $user_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $conversation_id = $existing['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO chat_conversations (user_id, expert_id, last_message) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $expert_id, $message]);
            $conversation_id = $pdo->lastInsertId();
            
            // If it was a free message in a new conversation, increment the count
            if (isset($is_free_message) && $is_free_message) {
                $stmt = $pdo->prepare("UPDATE chat_conversations SET free_messages_used = 1 WHERE id = ?");
                $stmt->execute([$conversation_id]);
            }
        }
    }

    // 2. Insert message
    $stmt = $pdo->prepare("INSERT INTO chat_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)");
    $stmt->execute([$conversation_id, $user_id, $message]);
    $message_id = $pdo->lastInsertId();

    // 3. Update conversation last message
    $stmt = $pdo->prepare("UPDATE chat_conversations SET last_message = ? WHERE id = ?");
    $stmt->execute([$message, $conversation_id]);

    // 4. Generate Admin Bill for the Expert (if message was charged)
    if ($sender && $sender['role'] === 'user' && isset($is_free_message) && !$is_free_message) {
        require_once __DIR__ . '/billing_helper.php';
        // The charge is based on the credits deducted from the user.
        // Even though user pays in credits, the admin charge for the expert can be based on that.
        calculateAndGenerateBill($pdo, $expert_id, $credits_to_deduct, 'chat_message', $message_id);
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'message_id' => $message_id,
            'conversation_id' => $conversation_id,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
