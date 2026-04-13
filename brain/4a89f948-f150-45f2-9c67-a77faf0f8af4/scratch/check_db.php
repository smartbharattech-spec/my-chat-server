<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, name, product_type FROM marketplace_products');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
