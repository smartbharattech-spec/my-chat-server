<?php
require_once 'api/config.php';
$email = 'iamuser@gmail.com';
$stmt = $pdo->prepare("SELECT id, project_name, email, follower_id FROM projects WHERE email = ?");
$stmt->execute([$email]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($res as $r) {
    echo "ID: " . $r['id'] . " | Name: " . $r['project_name'] . " | Follower: " . $r['follower_id'] . "\n";
}
?>
