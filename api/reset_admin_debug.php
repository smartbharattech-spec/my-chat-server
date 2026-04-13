<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';
$password = password_hash('admin123', PASSWORD_DEFAULT);
$email = 'admin@gmail.com';

try {
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
    $stmt->execute([$password, $email]);
    echo "Password updated for $email";
} catch (Exception $e) {
    echo $e->getMessage();
}
?>