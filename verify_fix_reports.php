<?php
require 'api/config.php';

echo "--- VERIFY projects.php?follower_id=33 (Marketplace User) ---\n";
// Manually simulate the GET request logic from projects.php
$followerId = 33;
$emailSubquery = "(SELECT email FROM users WHERE id = :followerId UNION SELECT email FROM marketplace_users WHERE id = :followerId LIMIT 1)";
$sql = "SELECT id, project_name, follower_id FROM projects WHERE follower_id IN (SELECT id FROM users WHERE email = $emailSubquery UNION SELECT id FROM marketplace_users WHERE email = $emailSubquery)";
$stmt = $pdo->prepare($sql);
$stmt->execute(['followerId' => $followerId]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($results)) {
    echo "✅ SUCCESS: Project 165 visible for User 33!\n";
    print_r($results);
} else {
    echo "❌ FAILURE: Project 165 not found for User 33.\n";
}

echo "\n--- VERIFY get_followers.php logic ---\n";
$sql = "SELECT * FROM (
            SELECT id as user_id, name, email, phone FROM marketplace_users WHERE role = 'user'
            UNION
            SELECT id as user_id, firstname as name, email, mobile as phone FROM users WHERE is_consultant = 0
        ) as combined_users
        GROUP BY email
        ORDER BY name ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$followers = $stmt->fetchAll(PDO::FETCH_ASSOC);

$found = false;
foreach ($followers as $f) {
    if ($f['email'] === 'hkjfhksdj@gmail.com') {
        echo "✅ SUCCESS: Found unified follower 'hfkdjsh' with ID {$f['user_id']}\n";
        $found = true;
    }
}
if (!$found) echo "❌ FAILURE: Follower 'hfkdjsh' not found in unified list.\n";

?>
