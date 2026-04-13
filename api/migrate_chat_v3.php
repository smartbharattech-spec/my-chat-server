<?php
require_once 'config.php';
try {
    // Step 1: Allow NULL for user_id
    $pdo->exec("ALTER TABLE chat_conversations MODIFY COLUMN user_id INT(11) NULL");
    echo "Step 1: user_id made nullable. OK\n";

    // Step 2: Add 'type' column if not exists
    $pdo->exec("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'private' AFTER id");
    echo "Step 2: type column added. OK\n";

    // Step 3: Add 'title' column if not exists
    $pdo->exec("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT NULL AFTER type");
    echo "Step 3: title column added. OK\n";

    // Step 4: Create broadcast rooms for ALL experts
    $stmt = $pdo->query("SELECT id, name FROM marketplace_users WHERE role = 'expert'");
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $count = 0;
    foreach ($experts as $e) {
        $expert_id = $e['id'];
        $eName = $e['name'];
        $roomTitle = "$eName's Community";

        $check = $pdo->prepare("SELECT id FROM chat_conversations WHERE expert_id = ? AND type = 'broadcast'");
        $check->execute([$expert_id]);
        if (!$check->fetch()) {
            $ins = $pdo->prepare("INSERT INTO chat_conversations (type, expert_id, user_id, title, last_message) VALUES ('broadcast', ?, NULL, ?, 'Welcome to the community group!')");
            $ins->execute([$expert_id, $roomTitle]);
            $count++;
            echo "Created room for: $eName (ID $expert_id)\n";
        } else {
            echo "Room already exists for: $eName (ID $expert_id)\n";
        }
    }

    echo "\nDONE! Created $count new broadcast rooms successfully.\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
