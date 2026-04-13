<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT expert_id FROM community_memberships WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user_id]);
    $joined = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $joined]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
