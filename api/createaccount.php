<?php
// Prevent any output before JSON
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Register shutdown function to catch fatal errors
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        ob_clean(); // Clear any partial output
        echo json_encode(['status' => 'error', 'message' => 'Server Error: ' . $error['message']]);
        exit;
    }
    ob_end_flush();
});

// -------------------------
// Database configuration
// -------------------------
require_once 'config.php';

// -------------------------
// Get POST data
// -------------------------
$input = json_decode(file_get_contents("php://input"), true);

$firstname = isset($input['firstname']) ? trim($input['firstname']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$mobile = isset($input['mobile']) ? trim($input['mobile']) : '';
$whatsapp = isset($input['whatsapp']) ? trim($input['whatsapp']) : '';
$city = isset($input['city']) ? trim($input['city']) : '';
$state = isset($input['state']) ? trim($input['state']) : '';

// -------------------------
// Basic validation
// -------------------------
if (empty($firstname) || empty($email) || empty($password) || empty($mobile) || empty($whatsapp)) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email address.']);
    exit;
}

// -------------------------
// Check if email already exists
// -------------------------
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() > 0) {
    echo json_encode(['status' => 'error', 'message' => 'Email already registered.']);
    exit;
}

// -------------------------
// Hash password and Register
// -------------------------
require_once 'mail_config.php';
require_once 'email_templates.php';

try {
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $verification_token = bin2hex(random_bytes(32));
    $is_verified = 0;

    // Handle is_consultant (default to 0 if not provided)
    $is_consultant = isset($input['is_consultant']) ? (int) $input['is_consultant'] : 0;

    // Auto-assign Free Plane dynamically
    $stmt = $pdo->prepare("SELECT id, title, validity_days FROM plans WHERE is_free = '1' LIMIT 1");
    $stmt->execute();
    $freePlan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $plan_id = $freePlan ? $freePlan['id'] : null;
    $plan_name = $freePlan ? $freePlan['title'] : null;
    $validity_days = $freePlan ? (int)$freePlan['validity_days'] : 0;
    $plan_expiry = ($freePlan && $validity_days > 0) ? date('Y-m-d H:i:s', strtotime("+$validity_days days")) : null;
    $activated_at = $plan_id ? date('Y-m-d H:i:s') : null;

    $stmt = $pdo->prepare("INSERT INTO users (firstname, email, password, mobile, whatsapp, city, state, verification_token, is_verified, is_consultant, plan, plan_id, plan_activated_at, plan_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if ($stmt->execute([$firstname, $email, $hashed_password, $mobile, $whatsapp, $city, $state, $verification_token, $is_verified, $is_consultant, $plan_name, $plan_id, $activated_at, $plan_expiry])) {

        // Send Verification Email
        $verificationLink = API_URL . "/verify_email.php?token=" . $verification_token;
        $emailBody = getVerificationEmailTemplate($verificationLink);

        $mailResult = sendMail($email, "Verify your email - MyVastuTool", $emailBody);

        if ($mailResult['status']) {
            echo json_encode(['status' => 'success', 'message' => 'Registration successful! Please check your email to verify your account.']);
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Registration successful, but failed to send verification email. Please contact support.']);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Registration failed.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>