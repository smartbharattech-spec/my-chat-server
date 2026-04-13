<?php
require 'api/config.php';
$stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = ?');
$stmt->execute(['iamuser1@gmail.com']);
print_r($stmt->fetch(PDO::FETCH_ASSOC));
?>
