<?php
require 'api/config.php';
$stmt = $pdo->query("DESCRIBE tracker_submissions");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($columns, JSON_PRETTY_PRINT);
