<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
$expert_id = isset($input['expert_id']) ? (int) $input['expert_id'] : 0;
$status = isset($input['status']) ? trim($input['status']) : '';
$action = isset($input['action']) ? trim($input['action']) : 'status_update'; // new field

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
    exit;
}

try {
    if ($action === 'verify_identity') {
        $stmt = $pdo->prepare("UPDATE expert_profiles SET is_verified = 1 WHERE user_id = ?");
        if ($stmt->execute([$expert_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Expert identity verified successfully. Profile is NOT live yet.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to verify identity.']);
        }
    } else if ($action === 'toggle_visibility') {
        $stmt = $pdo->prepare("UPDATE expert_profiles SET is_visible = NOT is_visible WHERE user_id = ?");
        if ($stmt->execute([$expert_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Profile visibility toggled.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to toggle visibility.']);
        }
    } else if ($action === 'reject_identity') {
        $stmt = $pdo->prepare("UPDATE expert_profiles SET is_verified = -1 WHERE user_id = ?");
        if ($stmt->execute([$expert_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Expert identity rejected.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to reject identity.']);
        }
    } else if ($action === 'interview_result') {
        if (!in_array($status, ['passed', 'failed'])) {
             echo json_encode(['status' => 'error', 'message' => 'Invalid interview result']);
             exit;
        }
        $stmt = $pdo->prepare("UPDATE expert_profiles SET interview_status = ? WHERE user_id = ?");
        if ($stmt->execute([$status, $expert_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Interview result saved as ' . $status]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update interview result.']);
        }
    } else if ($action === 'status_update') {
        if (!in_array($status, ['active', 'rejected', 'pending'])) {
             echo json_encode(['status' => 'error', 'message' => 'Invalid status']);
             exit;
        }
        $stmt = $pdo->prepare("UPDATE marketplace_users SET status = ? WHERE id = ? AND role = 'expert'");
        if ($stmt->execute([$status, $expert_id])) {
            echo json_encode(['status' => 'success', 'message' => 'Expert status updated to ' . $status]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update expert status.']);
        }
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
