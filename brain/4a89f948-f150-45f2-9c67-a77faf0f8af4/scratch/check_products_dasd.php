<?php
require 'api/config.php';
$stmt = $pdo->query("SELECT id, name, image_url, product_type FROM marketplace_products WHERE name LIKE '%dasd%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
