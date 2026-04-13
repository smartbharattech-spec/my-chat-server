<?php
require 'api/config.php';
$stmt = $pdo->query("DESCRIBE projects");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($cols, JSON_PRETTY_PRINT);
