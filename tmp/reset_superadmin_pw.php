<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

$email = 'superadmin@vastu.com';
$new_password = 'password';
$hash = password_hash($new_password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
    $stmt->execute([$hash, $email]);
    echo "General Super Admin password reset successfully for $email. New password is: $new_password";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
