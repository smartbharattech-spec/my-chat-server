<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT community_type, community_fee FROM expert_profiles WHERE user_id = ?");
    $stmt->execute([$expert_id]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($settings) {
        echo json_encode(['status' => 'success', 'data' => $settings]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Expert profile not found.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
