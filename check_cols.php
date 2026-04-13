<?php
require_once 'api/config.php';
$stmt = $pdo->query("DESCRIBE marketplace_order_items");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
