<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$amount = isset($input['amount']) ? (int)$input['amount'] : 0;
$admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;

if (!$user_id || $amount <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and positive amount are required.']);
    exit;
}

try {
    // Basic admin check (could be more robust with a token/session)
    if ($admin_id) {
        $stmt = $pdo->prepare("SELECT role FROM marketplace_users WHERE id = ?");
        $stmt->execute([$admin_id]);
        $admin = $stmt->fetch();
        if (!$admin || $admin['role'] !== 'admin') {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin role required.']);
            exit;
        }
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("UPDATE marketplace_users SET credits = credits + ? WHERE id = ?");
    $stmt->execute([$amount, $user_id]);

    // Optional: Log transaction
    // $stmt = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', 'Admin added credits')");
    // $stmt->execute([$user_id, $amount]);

    $pdo->commit();

    echo json_encode(['status' => 'success', 'message' => "Added $amount credits successfully."]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
