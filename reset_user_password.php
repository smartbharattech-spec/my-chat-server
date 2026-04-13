<?php
require 'api/config.php';

$email = 'demo@gmail.com';
$password = '123456';
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$hashed_password, $email]);

    if ($stmt->rowCount() > 0) {
        echo "Password for $email updated successfully to '$password'.\n";
    } else {
        echo "No changes made (email might not exist or password was already the same or user not found).\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
