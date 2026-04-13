<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($user_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid user ID.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT m.id as user_id, m.name, m.email, m.phone, m.city, m.state, m.role, m.status as account_status,
               e.slug, e.primary_skill, e.expertise_tags, e.experience_years, e.bio, e.hourly_rate, 
               e.languages, e.profile_image, e.banner_image, e.is_live, e.is_ecommerce_enabled, e.per_message_charge, e.free_message_limit,
               e.community_type, e.community_fee,
               (SELECT COUNT(*) FROM marketplace_follows WHERE expert_id = m.id) as followers_count
        FROM marketplace_users m
        LEFT JOIN expert_profiles e ON m.id = e.user_id 
        WHERE m.id = ?
    ");
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        echo json_encode([
            'status' => 'success',
            'profile' => $profile
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Profile not found.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
