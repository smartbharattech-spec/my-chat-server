<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, title, plan_type FROM plans');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
