<?php
require 'api/config.php';
$stmt = $pdo->query('DESCRIBE community_posts');
$schema = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($schema, JSON_PRETTY_PRINT);
?>
