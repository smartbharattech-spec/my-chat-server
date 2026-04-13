<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int) $input['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid user ID']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Delete from expert_profiles (if exists)
    $stmt1 = $pdo->prepare("DELETE FROM expert_profiles WHERE user_id = ?");
    $stmt1->execute([$user_id]);

    // 2. Delete from marketplace_users
    $stmt2 = $pdo->prepare("DELETE FROM marketplace_users WHERE id = ?");
    $stmt2->execute([$user_id]);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
