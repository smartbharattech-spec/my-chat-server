<?php
require 'api/config.php';
$stmt = $pdo->query("DESCRIBE marketplace_follows");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\nData in marketplace_follows:\n";
$stmt = $pdo->query("SELECT * FROM marketplace_follows LIMIT 10");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
