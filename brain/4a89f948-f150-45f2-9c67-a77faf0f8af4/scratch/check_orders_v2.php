<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, product_id, product_type FROM marketplace_orders WHERE id IN (14, 15, 16)');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
