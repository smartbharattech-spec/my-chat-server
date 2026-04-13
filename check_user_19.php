<?php
require_once 'api/config.php';
$stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = 19");
$stmt->execute();
$user = $stmt->fetch();
echo json_encode($user, JSON_PRETTY_PRINT);
?>
