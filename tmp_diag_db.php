<?php
require_once '../config.php';
header('Content-Type: application/json');
$response = [];

$tables = ['marketplace_users', 'expert_profiles', 'chat_conversations', 'marketplace_settings'];
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $response[$table]['columns'] = $stmt->fetchAll();
    } catch (Exception $e) {
        $response[$table]['error'] = $e->getMessage();
    }
}

// Check if any expert has paid chat enabled
try {
    $stmt = $pdo->query("SELECT user_id, per_message_charge, free_message_limit FROM expert_profiles WHERE per_message_charge > 0 LIMIT 5");
    $response['paid_experts'] = $stmt->fetchAll();
} catch (Exception $e) {
    $response['expert_sample_error'] = $e->getMessage();
}

// Check global setting
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM marketplace_settings WHERE setting_key = 'credits_per_message'");
    $stmt->execute();
    $response['global_setting'] = $stmt->fetch();
} catch (Exception $e) {
    $response['global_setting_error'] = $e->getMessage();
}

echo json_encode($response);
