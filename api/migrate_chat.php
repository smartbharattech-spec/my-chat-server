<?php
require_once 'config.php';
try {
    // 1. Add 'type' column to chat_conversations
    $pdo->exec("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'private' AFTER id");
    
    // 2. Add 'title' column to chat_conversations (for group names if needed)
    $pdo->exec("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT NULL AFTER type");

    echo "Database schema updated successfully.\n";

    // 3. Create Broadcast rooms for all experts who have followers
    $stmt = $pdo->query("SELECT DISTINCT expert_id FROM marketplace_follows");
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($experts as $e) {
        $expert_id = $e['expert_id'];
        // Check if broadcast room already exists
        $check = $pdo->prepare("SELECT id FROM chat_conversations WHERE expert_id = ? AND type = 'broadcast'");
        $check->execute([$expert_id]);
        if (!$check->fetch()) {
            $stmt = $pdo->prepare("INSERT INTO chat_conversations (type, expert_id, user_id, title, last_message) VALUES ('broadcast', ?, 0, 'Community Broadcast', 'Welcome to the community group!')");
            $stmt->execute([$expert_id]);
            echo "Created broadcast room for expert ID $expert_id\n";
        }
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
