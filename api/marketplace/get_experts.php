<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

try {
    // Fetch experts from expert_profiles joined with marketplace_users
    // only active experts
    $sql = "SELECT u.id as user_id, u.name, u.email, u.phone, u.is_online,
                   ep.primary_skill, ep.experience_years, ep.bio, ep.rating, ep.expert_type,
                   ep.profile_image, ep.is_verified, ep.is_live, ep.slug,
                   ep.community_type, ep.community_fee
            FROM marketplace_users u
            JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.role = 'expert' AND u.status = 'active' AND ep.is_visible = 1
            ORDER BY ep.rating DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $experts
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
