<?php
require_once 'config.php';
$stmt = $pdo->query("SELECT id, username, email, role, permissions FROM admins ORDER BY id DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
