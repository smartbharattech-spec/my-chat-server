<?php
require 'api/config.php';
echo "--- USER ID 157 in users table ---\n";
$stmt = $pdo->prepare("SELECT id, email, firstname, lastname FROM users WHERE id = 157");
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));

echo "\n--- ALL hfkdjsh in users table ---\n";
$stmt = $pdo->prepare("SELECT id, email, firstname FROM users WHERE firstname LIKE '%hfkdjsh%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- ALL hfkdjsh in marketplace_users table ---\n";
$stmt = $pdo->prepare("SELECT id, email, name FROM marketplace_users WHERE name LIKE '%hfkdjsh%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
