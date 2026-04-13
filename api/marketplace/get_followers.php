<?php
header('Content-Type: application/json');
require_once '../config.php';

$expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

try {
    // Fetch unique users from BOTH 'users' and 'marketplace_users' tables
    // We prioritize 'marketplace_users' IDs if a user exists in both, for better marketplace integration.
    $stmt = $pdo->prepare("
        SELECT u.id as user_id, u.name, u.email, u.phone, u.updated_at,
               (CASE WHEN u.is_online = 1 AND u.updated_at >= (NOW() - INTERVAL 1 MINUTE) THEN 1 ELSE 0 END) as is_online, 
               f.created_at as followed_at
        FROM marketplace_follows f
        JOIN marketplace_users u ON f.user_id = u.id
        WHERE f.expert_id = ?
        ORDER BY followed_at DESC
    ");
    $stmt->execute([$expert_id]);
    $followers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $followers]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
