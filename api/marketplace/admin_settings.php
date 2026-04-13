<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';

try {
    if ($action === 'get_settings') {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM marketplace_settings");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        echo json_encode(['status' => 'success', 'settings' => $settings]);

    } elseif ($action === 'update_settings') {
        $key = isset($data['key']) ? $data['key'] : '';
        $value = isset($data['value']) ? $data['value'] : '';

        if (empty($key)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid setting key.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO marketplace_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        $stmt->execute([$key, $value]);

        echo json_encode(['status' => 'success', 'message' => 'Setting updated.']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
