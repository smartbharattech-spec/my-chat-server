<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT DISTINCT plan_name FROM projects");
print_r($stmt->fetchAll());
?>