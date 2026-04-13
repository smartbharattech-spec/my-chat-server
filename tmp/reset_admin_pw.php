<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

$email = 'occultadmin@thesanatangurukul.com';
$new_password = 'password'; // Standard temporary password
$hash = password_hash($new_password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("UPDATE marketplace_users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hash, $email]);
    echo "Password reset successfully for $email. New password is: $new_password";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
