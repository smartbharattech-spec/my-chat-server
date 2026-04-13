<?php
require_once 'config.php';
try {
    $email = 'superadmin@vastu.com';
    $new_password = 'admin123';
    $hashed = password_hash($new_password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = ?");
    $stmt->execute([$hashed, $email]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Password for $email reset to $new_password"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Could not find user $email"]);
    }
} catch (PDOException $e) {
    echo $e->getMessage();
}
?>