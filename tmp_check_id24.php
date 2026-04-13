<?php
require 'api/config.php';
$stmt = $pdo->prepare('SELECT id, email, firstname FROM users WHERE id = 24');
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
