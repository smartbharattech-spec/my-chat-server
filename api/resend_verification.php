<?php
// Prevent any output before JSON
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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

require_once 'config.php';
require_once 'mail_config.php';
require_once 'email_templates.php';

$input = json_decode(file_get_contents("php://input"), true);
$email = isset($input['email']) ? trim($input['email']) : '';

if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'Email is required.']);
    exit;
}

try {
    // Check if user exists and is not verified
    $stmt = $pdo->prepare("SELECT id, is_verified, verification_token FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User with this email not found.']);
        exit;
    }

    if ($user['is_verified'] == 1) {
        echo json_encode(['status' => 'error', 'message' => 'This account is already verified.']);
        exit;
    }

    // Generate new token or use existing one? Let's generate a new one for security.
    $verification_token = bin2hex(random_bytes(32));
    $updateStmt = $pdo->prepare("UPDATE users SET verification_token = ? WHERE id = ?");
    $updateStmt->execute([$verification_token, $user['id']]);

    // Send Verification Email
    $verificationLink = API_URL . "/verify_email.php?token=" . $verification_token;
    $emailBody = getVerificationEmailTemplate($verificationLink);

    $mailResult = sendMail($email, "Verify your email - MyVastuTool (Resend)", $emailBody);

    if ($mailResult['status']) {
        echo json_encode(['status' => 'success', 'message' => 'Verification email resent! Please check your inbox.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to resend verification email. Please try again later.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>