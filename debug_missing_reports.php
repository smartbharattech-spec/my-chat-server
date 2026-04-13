<?php
require 'api/config.php';
echo "--- TABLES ---\n";
$stmt = $pdo->query("SHOW TABLES");
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));

echo "\n--- PROJECTS TABLE SCHEMA ---\n";
$stmt = $pdo->query("DESCRIBE projects");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- RECENT PROJECTS ---\n";
$stmt = $pdo->query("SELECT id, follower_id, project_name, email FROM projects ORDER BY id DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- MARKETPLACE USERS ---\n";
$stmt = $pdo->query("SELECT id, email, firstname FROM marketplace_users LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- USERS TABLE ---\n";
$stmt = $pdo->query("SELECT id, email, firstname FROM users LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
