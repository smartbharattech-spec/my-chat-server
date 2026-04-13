<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$expert_id = isset($_POST['expert_id']) ? (int)$_POST['expert_id'] : 0;
$community_type = isset($_POST['community_type']) ? $_POST['community_type'] : 'free';
$community_fee = isset($_POST['community_fee']) ? (float)$_POST['community_fee'] : 0.00;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE expert_profiles SET community_type = ?, community_fee = ? WHERE user_id = ?");
    $stmt->execute([$community_type, $community_fee, $expert_id]);
    
    echo json_encode(['status' => 'success', 'message' => 'Community settings updated successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
