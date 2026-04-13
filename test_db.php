<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT id, title, tool_name FROM tutorials');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
