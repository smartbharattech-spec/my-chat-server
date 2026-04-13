<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, email, plan, purchase_type, status FROM payments ORDER BY id DESC LIMIT 5');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>