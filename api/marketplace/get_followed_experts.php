<?php
header('Content-Type: application/json');
require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT u.id as user_id, u.name, 
               (CASE WHEN u.is_online = 1 AND u.updated_at >= (NOW() - INTERVAL 1 MINUTE) THEN 1 ELSE 0 END) as is_online,
               ep.primary_skill, ep.rating, ep.profile_image, ep.slug
        FROM marketplace_follows f
        JOIN marketplace_users u ON f.expert_id = u.id
        JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE f.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $experts = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'data' => $experts]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
