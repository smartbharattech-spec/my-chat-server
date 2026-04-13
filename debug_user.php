<?php
require_once 'api/config.php';
$name = 'iamuser';
$stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE name LIKE ? OR email LIKE ?");
$stmt->execute(["%$name%", "%$name%"]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "USERS FOUND: \n";
print_r($users);

foreach ($users as $u) {
    $email = $u['email'];
    $uid = $u['id'];
    
    echo "\n--- Data for User: $email (ID: $uid) ---\n";
    
    // Check projects
    $pStmt = $pdo->prepare("SELECT id, project_name, follower_id, expert_id, email as p_email FROM projects WHERE follower_id = ? OR email = ?");
    $pStmt->execute([$uid, $email]);
    $projs = $pStmt->fetchAll(PDO::FETCH_ASSOC);
    echo "PROJECTS:\n";
    print_r($projs);
    
    // Check tracker_submissions
    $tStmt = $pdo->prepare("SELECT id, project_id, remedy_id, problem, status FROM tracker_submissions WHERE user_email = ?");
    $tStmt->execute([$email]);
    $subs = $tStmt->fetchAll(PDO::FETCH_ASSOC);
    echo "TRACKER SUBMISSIONS:\n";
    print_r($subs);
}
?>