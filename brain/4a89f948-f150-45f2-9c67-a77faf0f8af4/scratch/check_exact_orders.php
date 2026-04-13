<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, product_id, status FROM marketplace_orders WHERE id IN (10, 11, 12)');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
