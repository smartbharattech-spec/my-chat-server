<?php
require 'api/config.php';
$email = 'superadmin@vastu.com';

// Mock the request
$_POST = json_decode(json_encode(['email' => $email]), true);
require 'api/admin_forgot_password.php';

// Check database for token
$stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ?");
$stmt->execute([$email]);
$reset = $stmt->fetch();
if ($reset) {
    echo "\nSUCCESS: Token for $email found: " . $reset['token'] . "\n";
} else {
    echo "\nFAILURE: Token not found in database.\n";
}
?>
