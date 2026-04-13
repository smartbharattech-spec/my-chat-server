<?php
require_once 'api/config.php';
$stmt = $pdo->query("DESCRIBE tracker_submissions");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
