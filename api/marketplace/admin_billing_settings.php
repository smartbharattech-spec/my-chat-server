<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';

try {
    if ($action === 'get_settings') {
        $stmt = $pdo->query("SELECT * FROM expert_billing_settings");
        $settings = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'settings' => $settings]);

    } elseif ($action === 'update_setting') {
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $charge_type = isset($data['charge_type']) ? $data['charge_type'] : '';
        $charge_value = isset($data['charge_value']) ? (float)$data['charge_value'] : 0;

        if (!$id || !in_array($charge_type, ['percentage', 'fixed'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid parameters.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE expert_billing_settings SET charge_type = ?, charge_value = ? WHERE id = ?");
        $stmt->execute([$charge_type, $charge_value, $id]);

        echo json_encode(['status' => 'success', 'message' => 'Billing setting updated.']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
