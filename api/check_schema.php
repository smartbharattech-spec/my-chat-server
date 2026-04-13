<?php
require_once 'config.php';
$stmt = $pdo->query('DESCRIBE user_property_details');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
