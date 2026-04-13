<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, product_id, status FROM marketplace_orders ORDER BY id DESC LIMIT 5');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
