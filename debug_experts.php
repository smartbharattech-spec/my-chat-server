<?php
require_once __DIR__ . '/api/config.php';

try {
    $userCount = $pdo->query("SELECT COUNT(*) FROM marketplace_users WHERE role = 'expert'")->fetchColumn();
    $activeUserCount = $pdo->query("SELECT COUNT(*) FROM marketplace_users WHERE role = 'expert' AND status = 'active'")->fetchColumn();
    $profileCount = $pdo->query("SELECT COUNT(*) FROM expert_profiles")->fetchColumn();
    $visibleProfileCount = $pdo->query("SELECT COUNT(*) FROM expert_profiles WHERE is_visible = 1")->fetchColumn();
    
    $joinCount = $pdo->query("
        SELECT COUNT(*) 
        FROM marketplace_users u
        JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE u.role = 'expert' AND u.status = 'active' AND ep.is_visible = 1
    ")->fetchColumn();

    echo "Total experts in marketplace_users: " . $userCount . "\n";
    echo "Active experts in marketplace_users: " . $activeUserCount . "\n";
    echo "Total profiles in expert_profiles: " . $profileCount . "\n";
    echo "Visible profiles in expert_profiles: " . $visibleProfileCount . "\n";
    echo "Result of join (what the API should return): " . $joinCount . "\n";

    if ($joinCount == 0) {
        echo "\nDEBUG INFO:\n";
        $sampleUsers = $pdo->query("SELECT id, name, role, status FROM marketplace_users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        echo "Sample users:\n";
        print_r($sampleUsers);
        
        $sampleProfiles = $pdo->query("SELECT user_id, is_visible FROM expert_profiles LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        echo "Sample profiles:\n";
        print_r($sampleProfiles);
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
