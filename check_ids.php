<?php
require 'api/config.php';
$stmt = $pdo->query("SELECT id, name, role FROM marketplace_users WHERE id IN (23, 24)");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
