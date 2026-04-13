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
    echo json_encode(['status' => false, 'message' => 'All fields are required.']);
    exit;
}

try {
    // 1. Verify OTP
    $stmt = $pdo->prepare("SELECT created_at FROM password_resets WHERE email = ? AND token = ?");
    $stmt->execute([$email, $otp]);
    $resetRequest = $stmt->fetch();

    if (!$resetRequest) {
        echo json_encode(['status' => false, 'message' => 'Invalid or incorrect verification code.']);
        exit;
    }

    // 2. Check Expiry (15 minutes)
    $createdAt = strtotime($resetRequest['created_at']);
    $expiresAt = $createdAt + (15 * 60);

    if (time() > $expiresAt) {
        // Token expired, delete it
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        echo json_encode(['status' => false, 'message' => 'Verification code has expired. Please request a new one.']);
        exit;
    }

    // 3. Update Password in admins table
    $hashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);

    if ($stmt->rowCount() > 0) {
        // 4. Delete Token after success
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        
        echo json_encode([
            'status' => true,
            'message' => 'Your admin password has been reset successfully. You can now login.'
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Update failed. Admin account might not exist or password is the same.'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
