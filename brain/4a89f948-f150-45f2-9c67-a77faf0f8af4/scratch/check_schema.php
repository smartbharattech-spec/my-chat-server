<?php
require 'api/config.php';
$stmt = $pdo->query('DESCRIBE marketplace_orders');
echo "marketplace_orders:\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->query('DESCRIBE marketplace_order_items');
echo "\nmarketplace_order_items:\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
