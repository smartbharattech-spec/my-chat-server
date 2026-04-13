<?php
require 'api/config.php';
$stmt = $pdo->prepare('SELECT id, email, firstname, is_consultant FROM users WHERE email = ?');
$stmt->execute(['iamexpert@gmail.com']);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
