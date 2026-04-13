<?php
require 'api/config.php';
$stmt = $pdo->query("SHOW TABLES LIKE 'marketplace_follows'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
