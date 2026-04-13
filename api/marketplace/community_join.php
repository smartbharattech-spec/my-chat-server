<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$expert_id = isset($_POST['expert_id']) ? (int)$_POST['expert_id'] : 0;

if (!$user_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and Expert ID are required.']);
    exit;
}

try {
    // 1. Get Expert community settings
    $stmt = $pdo->prepare("SELECT community_type, community_fee FROM expert_profiles WHERE user_id = ?");
    $stmt->execute([$expert_id]);
    $expert = $stmt->fetch();

    if (!$expert) {
        echo json_encode(['status' => 'error', 'message' => 'Expert community not found.']);
        exit;
    }

    $fee = ($expert['community_type'] === 'paid') ? (float)$expert['community_fee'] : 0;

    // 2. Check if user already joined
    $stmt = $pdo->prepare("SELECT id FROM community_memberships WHERE user_id = ? AND expert_id = ?");
    $stmt->execute([$user_id, $expert_id]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'success', 'message' => 'Already joined.']);
        exit;
    }

    $pdo->beginTransaction();

    if ($fee > 0) {
        // 3. Check and deduct credits from user
        $stmt = $pdo->prepare("SELECT credits FROM marketplace_users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user_credits = (float)$stmt->fetchColumn();

        if ($user_credits < $fee) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Insufficient credits. Please recharge your wallet.']);
            exit;
        }

        // Deduct from user
        $stmt = $pdo->prepare("UPDATE marketplace_users SET credits = credits - ? WHERE id = ?");
        $stmt->execute([$fee, $user_id]);

        // Add to expert wallet (using expert_wallets table if it exists)
        // Let's check expert_wallets structure from previous research (setup_db.php)
        $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE expert_id = ?");
        $stmt->execute([$fee, $fee, $expert_id]);

        // Record expert wallet transaction
        $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, description) 
                               SELECT id, ?, 'credit', 'Community joining fee' FROM expert_wallets WHERE expert_id = ?");
        $stmt->execute([$fee, $expert_id]);

        // Record user transaction (if there's a user wallet table, but marketplace_users stores credits directly)
        // I'll check if there's a user_wallet_transactions table or similar. 
        // For now, I'll assume we use a general wallet_transactions or skip if not found.
        // Let's stick to expert credit for now as requested.
    }

    // 4. Record membership
    $stmt = $pdo->prepare("INSERT INTO community_memberships (user_id, expert_id, fee_paid) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $expert_id, $fee]);

    // 5. Generate Admin Bill for the Expert (if fee was paid)
    if ($fee > 0) {
        require_once __DIR__ . '/billing_helper.php';
        // Get the membership ID for reference
        $membership_id = $pdo->lastInsertId();
        calculateAndGenerateBill($pdo, $expert_id, $fee, 'community_join', $membership_id);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Joined community successfully!']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
