<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

if (empty($slug)) {
    echo json_encode(['status' => 'error', 'message' => 'Slug is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT m.id as user_id, m.name, m.email, m.status as user_status, m.city, m.state, m.is_online,
               e.id as profile_id, e.primary_skill, e.experience_years, 
               e.bio, e.expert_type, e.is_verified, e.expertise_tags, 
               e.slug, e.profile_image, e.banner_image, e.is_live, e.is_ecommerce_enabled,
               e.hourly_rate, e.languages, e.per_message_charge, e.free_message_limit
        FROM marketplace_users m
        LEFT JOIN expert_profiles e ON m.id = e.user_id
        WHERE LOWER(e.slug) = LOWER(?)
    ");
    $stmt->execute([$slug]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        if (!$profile['profile_id']) {
             echo json_encode(['status' => 'error', 'message' => 'User found but expert profile is missing in DB (Slug: ' . $slug . ')']);
        } else if ($profile['user_status'] !== 'active') {
             echo json_encode(['status' => 'error', 'message' => 'Expert account is not active. Status: ' . $profile['user_status']]);
        } else {
             echo json_encode(['status' => 'success', 'profile' => $profile]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Profile not found. Slug "' . $slug . '" does not exist on live DB.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
