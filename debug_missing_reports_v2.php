<?php
require 'api/config.php';
echo "--- MARKETPLACE USERS SCHEMA ---\n";
$stmt = $pdo->query("DESCRIBE marketplace_users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- FIND USER hfkdjsh ---\n";
$stmt = $pdo->prepare("SELECT id, email, name, role FROM marketplace_users WHERE name LIKE '%hfkdjsh%' OR email LIKE '%hfkdjsh%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- CHECK PROJECT 165 --- \n";
$stmt = $pdo->prepare("SELECT * FROM projects WHERE id = 165");
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));
?>
