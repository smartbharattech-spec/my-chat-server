<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$input = json_decode(file_get_contents("php://input"), true);
$action = isset($input['action']) ? $input['action'] : (isset($_GET['action']) ? $_GET['action'] : '');
$user_id = isset($input['user_id']) ? $input['user_id'] : (isset($_GET['user_id']) ? $_GET['user_id'] : null);
$device_id = isset($input['device_id']) ? $input['device_id'] : null;

if (!$action) {
    echo json_encode(['status' => 'error', 'message' => 'Action is required.']);
    exit;
}

try {
    switch ($action) {
        case 'fetch':
            if (!$user_id) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
                exit;
            }
            $stmt = $pdo->prepare("SELECT id, device_id, user_agent, last_active FROM user_devices WHERE user_id = ? ORDER BY last_active DESC");
            $stmt->execute([$user_id]);
            $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $devices]);
            break;

        case 'logout':
            if (!$user_id || !$device_id) {
                echo json_encode(['status' => 'error', 'message' => 'User ID and Device ID are required.']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM user_devices WHERE user_id = ? AND device_id = ?");
            $stmt->execute([$user_id, $device_id]);
            echo json_encode(['status' => 'success', 'message' => 'Device logged out successfully.']);
            break;

        case 'logout_all':
            if (!$user_id) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required.']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM user_devices WHERE user_id = ?");
            $stmt->execute([$user_id]);
            echo json_encode(['status' => 'success', 'message' => 'All devices logged out successfully.']);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
            break;
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>