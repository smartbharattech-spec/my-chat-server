<?php
require 'api/config.php';

$email = 'superadmin@vastu.com';
$password = 'admin123';
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
    $stmt->execute([$hashed_password, $email]);

    if ($stmt->rowCount() > 0) {
        echo "Password for $email updated successfully to '$password'.\n";
    } else {
        echo "No changes made (email might not exist or password was already the same).\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
