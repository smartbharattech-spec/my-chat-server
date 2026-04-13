<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT email, expert_id, follower_id, COUNT(*) as count FROM projects GROUP BY email, expert_id, follower_id');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
