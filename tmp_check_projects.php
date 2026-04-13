<?php
require 'api/config.php';
$email = 'iamexpert@gmail.com';
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$u = $stmt->fetch();
if ($u) {
    $eid = $u['id'];
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM projects WHERE expert_id = ?');
    $stmt->execute([$eid]);
    echo "Expert ID: $eid, Projects count: " . $stmt->fetchColumn() . "\n";
    
    // Also check total projects
    $stmt = $pdo->query('SELECT COUNT(*) FROM projects');
    echo "Total projects in DB: " . $stmt->fetchColumn() . "\n";
} else {
    echo "User $email not found\n";
}
?>
