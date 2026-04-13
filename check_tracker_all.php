<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT * FROM tracker_submissions");
echo "TRACKER SUBMISSIONS:\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
