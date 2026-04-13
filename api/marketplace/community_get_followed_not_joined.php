<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
    exit;
}

try {
    // Fetch experts that the user follows but has NOT joined their community members table
    $sql = "SELECT u.id as user_id, u.name, 
                   ep.primary_skill, ep.profile_image, ep.rating, ep.slug,
                   ep.community_type, ep.community_fee
            FROM marketplace_follows f
            JOIN marketplace_users u ON f.expert_id = u.id
            JOIN expert_profiles ep ON u.id = ep.user_id
            LEFT JOIN community_memberships m ON f.expert_id = m.expert_id AND m.user_id = ?
            WHERE f.user_id = ? AND m.id IS NULL AND u.status = 'active'
            ORDER BY ep.rating DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $user_id]);
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $experts]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
