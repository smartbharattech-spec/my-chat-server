<?php
// Simulate the environment for get_followers.php
$_GET['expert_id'] = 24;

// Manually include config and run the logic to avoid path issues in CLI
require_once 'api/config.php';

try {
    $stmt = $pdo->prepare("
        SELECT u.id as user_id, u.name, u.email, u.phone, ep.profile_image, f.created_at as followed_at
        FROM marketplace_follows f
        JOIN marketplace_users u ON f.user_id = u.id
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE f.expert_id = ?
        ORDER BY f.created_at DESC
    ");
    $stmt->execute([24]);
    $followers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Status: success\n";
    echo "Count: " . count($followers) . "\n";
    print_r($followers);
} catch (PDOException $e) {
    echo "Status: error\n";
    echo "Message: " . $e->getMessage() . "\n";
}
?>
