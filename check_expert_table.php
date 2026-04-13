<?php
require_once __DIR__ . '/api/config.php';

try {
    echo "EXPERT_PROFILES Table Structure:\n";
    $stmt = $pdo->query("DESCRIBE expert_profiles");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    echo "\nAll Expert Profiles Data (selected columns):\n";
    $stmt = $pdo->query("SELECT user_id, is_visible, is_live, is_verified, primary_skill FROM expert_profiles");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
