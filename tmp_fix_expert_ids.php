<?php
require 'api/config.php';
$email = 'iamexpert@gmail.com';
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
if ($user) {
    $newId = $user['id'];
    $stmt = $pdo->prepare('UPDATE projects SET expert_id = ? WHERE email = ? AND (expert_id IS NULL OR expert_id = 24)');
    $stmt->execute([$newId, $email]);
    echo "Updated " . $stmt->rowCount() . " projects for $email to expert_id $newId\n";
} else {
    echo "User $email not found\n";
}
?>
