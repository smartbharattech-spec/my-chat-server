<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
$amount = isset($data['amount']) ? (float)$data['amount'] : 0;

if (!$expert_id || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid withdrawal amount.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Check balance
    $stmt = $pdo->prepare("SELECT id, balance FROM expert_wallets WHERE expert_id = ?");
    $stmt->execute([$expert_id]);
    $wallet = $stmt->fetch();

    if (!$wallet || $wallet['balance'] < $amount) {
        throw new Exception("Insufficient balance.");
    }

    // Update balance
    $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE expert_id = ?");
    $stmt->execute([$amount, $amount, $expert_id]);

    // Log transaction
    $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, status, description) VALUES (?, ?, 'debit', 'pending', ?)");
    $stmt->execute([$wallet['id'], $amount, "Withdrawal request of ₹$amount"]);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Withdrawal request submitted successfully.']);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Failed to process withdrawal: ' . $e->getMessage()]);
}
?>
