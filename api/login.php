<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // CORS ke liye
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Error logging setup
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/error_log.txt');
error_reporting(E_ALL);

require_once 'config.php';
// Database connection $pdo is already created in config.php

// Get POST data
$input = json_decode(file_get_contents("php://input"), true);
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($email) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email address.']);
    exit;
}

// Check user in database
$stmt = $pdo->prepare("SELECT id, firstname, email, password, plan_id, is_verified FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found.']);
    exit;
}

// Verify password
if (!password_verify($password, $user['password'])) {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect password.']);
    exit;
}

// Device Limit Logic
$device_id = $input['device_id'] ?? null;
if ($device_id) {
    // 1. Get Limit
    $limit = 3; // Default
    if (!empty($user['plan_id'])) {
        $stmtPlan = $pdo->prepare("SELECT device_limit FROM plans WHERE id = ?");
        $stmtPlan->execute([$user['plan_id']]);
        $planData = $stmtPlan->fetch(PDO::FETCH_ASSOC);
        if ($planData && isset($planData['device_limit'])) {
            $limit = $planData['device_limit'];
        }
    }

    // 2. Check if device exists
    $stmtDev = $pdo->prepare("SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?");
    $stmtDev->execute([$user['id'], $device_id]);
    $currentDev = $stmtDev->fetch();

    if ($currentDev) {
        // Update activity
        $pdo->prepare("UPDATE user_devices SET last_active = NOW() WHERE id = ?")->execute([$currentDev['id']]);
    } else {
        // New device: Check count
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM user_devices WHERE user_id = ?");
        $stmtCount->execute([$user['id']]);
        $count = $stmtCount->fetchColumn();

        if ($count >= $limit) {
            echo json_encode(['status' => 'error', 'message' => "Device limit reached. Plan allows max $limit devices. Log out from other devices."]);
            exit;
        }

        // Add device
        $pdo->prepare("INSERT INTO user_devices (user_id, device_id, user_agent) VALUES (?, ?, ?)")
            ->execute([$user['id'], $device_id, $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown']);
    }
}

// Login successful
echo json_encode([
    'status' => 'success',
    'message' => 'Login successful.',
    'data' => [
        'id' => $user['id'],
        'firstname' => $user['firstname'],
        'email' => $user['email'],
        'is_verified' => $user['is_verified']
    ]
]);

