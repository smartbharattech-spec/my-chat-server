<?php
require_once __DIR__ . '/api/config.php';

$slug = 'rohit-781';

try {
    $stmt = $pdo->prepare("
        SELECT m.id as user_id, m.name, m.email, m.city, m.state, m.status as user_status,
               e.primary_skill, e.experience_years, 
               e.bio, e.expert_type, e.is_verified, e.expertise_tags, 
               e.custom_details, e.intro_video_url, e.slug,
               e.profile_image, e.banner_image, e.is_live,
               e.hourly_rate, e.languages
        FROM marketplace_users m
        JOIN expert_profiles e ON m.id = e.user_id
        WHERE e.slug = ?
    ");
    $stmt->execute([$slug]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        echo "Profile Found:\n";
        print_r($profile);
    } else {
        echo "Profile NOT Found for slug: $slug\n";
        
        // Check if slug exists at all
        $check = $pdo->prepare("SELECT COUNT(*) FROM expert_profiles WHERE slug = ?");
        $check->execute([$slug]);
        echo "Count in expert_profiles: " . $check->fetchColumn() . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
