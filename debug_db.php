<?php
require_once 'api/config.php';

try {
    $stmt = $pdo->query("SELECT user_id, COUNT(*) as count FROM expert_profiles GROUP BY user_id HAVING count > 1");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: text/plain');
    if ($duplicates) {
        echo "Found duplicate expert profiles for these user IDs:\n";
        print_r($duplicates);
    } else {
        echo "No duplicate expert profiles found for any user ID (checked user_id).\n";
    }
    
    // Also check for duplicate slugs
    $stmt = $pdo->query("SELECT slug, COUNT(*) as count FROM expert_profiles WHERE slug != '' GROUP BY slug HAVING count > 1");
    $dupSlugs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($dupSlugs) {
        echo "\nFound duplicate slugs:\n";
        print_r($dupSlugs);
    } else {
        echo "\nNo duplicate slugs found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>