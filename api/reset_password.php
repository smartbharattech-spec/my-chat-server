<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input['email'] ?? '');
$otp = trim($input['otp'] ?? '');
$new_password = $input['new_password'] ?? '';

if (empty($email) || empty($otp) || empty($new_password)) {
    echo json_encode(['status' => false, 'message' => 'All fields are required']);
    exit;
}

try {
    // Verify OTP
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ?");
    $stmt->execute([$email, $otp]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        echo json_encode(['status' => false, 'message' => 'Invalid or expired Verification Code']);
        exit;
    }

    // Check expiry (optional, e.g., 15 mins) - Skipping for simplicity or add later
    // $created_at = strtotime($reset['created_at']);
    // if (time() - $created_at > 900) { ... }

    // Update Password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    $update = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $update->execute([$hashed_password, $email]);

    // Delete used OTP
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    echo json_encode(['status' => true, 'message' => 'Password reset successful. Please login.']);

} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
