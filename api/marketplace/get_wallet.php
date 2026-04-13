<?php
header('Content-Type: application/json');
require_once '../config.php';

$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

try {
    // Ensure wallet exists
    $stmt = $pdo->prepare("INSERT IGNORE INTO expert_wallets (expert_id) VALUES (?)");
    $stmt->execute([$expert_id]);

    // Get wallet info
    $stmt = $pdo->prepare("SELECT * FROM expert_wallets WHERE expert_id = ?");
    $stmt->execute([$expert_id]);
    $wallet = $stmt->fetch();

    // Get transactions
    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC");
    $stmt->execute([$wallet['id']]);
    $transactions = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'wallet' => $wallet,
        'transactions' => $transactions
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch wallet info: ' . $e->getMessage()]);
}
?>
