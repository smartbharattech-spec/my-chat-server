<?php
require 'api/config.php';
$stmt = $pdo->query("DESCRIBE marketplace_users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
