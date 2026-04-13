<?php
require 'api/config.php';

echo "--- VERIFY projects.php?action=check&id=165&follower_id=33 ---\n";
// Manually simulate the action=check logic from projects.php
$id = 165;
$follower_id = 33;
$email = 'hkjfhksdj@gmail.com'; // User's email

$emailSubquery = "(SELECT email FROM users WHERE id = :follower_id UNION SELECT email FROM marketplace_users WHERE id = :follower_id LIMIT 1)";
$followerIdMatch = "follower_id IN (SELECT id FROM users WHERE email = $emailSubquery UNION SELECT id FROM marketplace_users WHERE email = $emailSubquery)";

$stmt = $pdo->prepare("SELECT id, project_name FROM projects WHERE (email = :email OR $followerIdMatch) AND id = :id LIMIT 1");
$stmt->execute(['email' => $email, 'follower_id' => $follower_id, 'id' => $id]);
$project = $stmt->fetch();

if ($project) {
    echo "✅ SUCCESS: Project 165 details accessible for User 33!\n";
    print_r($project);
} else {
    echo "❌ FAILURE: Project 165 details NOT found for User 33.\n";
}

?>
