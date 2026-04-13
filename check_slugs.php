<?php
require_once __DIR__ . '/api/config.php';

try {
    echo "Expert Slugs in Database:\n";
    $stmt = $pdo->query("SELECT u.name, ep.slug, u.status FROM marketplace_users u JOIN expert_profiles ep ON u.id = ep.user_id WHERE u.role = 'expert'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
