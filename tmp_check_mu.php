<?php
require 'api/config.php';
$stmt = $pdo->prepare('SELECT id, email, name FROM marketplace_users WHERE id IN (23, 24)');
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
