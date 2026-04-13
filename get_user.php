<?php
require_once '../config.php';
header('Content-Type: application/json');
$stmt = $pdo->query("SELECT id FROM marketplace_users WHERE role = 'user' LIMIT 1");
$user = $stmt->fetch();
echo json_encode($user);
