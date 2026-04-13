<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT * FROM occult_tracker");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
