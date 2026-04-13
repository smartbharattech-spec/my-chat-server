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

if (empty($email) || empty($otp)) {
    echo json_encode(['status' => false, 'message' => 'Email and Verification Code are required']);
    exit;
}

try {
    // Verify OTP
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ?");
    $stmt->execute([$email, $otp]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($reset) {
        echo json_encode(['status' => true, 'message' => 'Verification successful']);
    } else {
        echo json_encode(['status' => false, 'message' => 'Invalid or expired Verification Code']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
