<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$user_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID and Expert ID are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM community_memberships WHERE user_id = ? AND expert_id = ? AND status = 'active'");
    $stmt->execute([$user_id, $expert_id]);
    $joined = $stmt->fetch() !== false;

    // Also get community info
    $stmt = $pdo->prepare("SELECT community_type, community_fee FROM expert_profiles WHERE user_id = ?");
    $stmt->execute([$expert_id]);
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'joined' => $joined, 'community_info' => $info]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
