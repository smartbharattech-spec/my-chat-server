<?php
require 'api/config.php';
$stmt = $pdo->query("SELECT id, title, thumbnail FROM courses WHERE title LIKE '%dasd%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
