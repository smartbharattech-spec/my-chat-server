<?php
require 'api/config.php';

echo "Starting data recovery migration...\n";

// 1. Fix Expert IDs
echo "Re-linking Experts...\n";
$stmt = $pdo->query("
    SELECT p.id as project_id, mu.email as expert_email, u.id as new_expert_id
    FROM projects p
    JOIN marketplace_users mu ON p.expert_id = mu.id
    JOIN users u ON mu.email = u.email
    WHERE p.expert_id != u.id OR p.expert_id IS NULL
");
$toUpdate = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Found " . count($toUpdate) . " expert IDs to update.\n";

foreach ($toUpdate as $row) {
    $pdo->prepare("UPDATE projects SET expert_id = ? WHERE id = ?")
        ->execute([$row['new_expert_id'], $row['project_id']]);
}

// 2. Fix Follower IDs
echo "Re-linking Followers...\n";
$stmt = $pdo->query("
    SELECT p.id as project_id, mu.email as follower_email, u.id as new_follower_id
    FROM projects p
    JOIN marketplace_users mu ON p.follower_id = mu.id
    JOIN users u ON mu.email = u.email
    WHERE p.follower_id != u.id OR p.follower_id IS NULL
");
$toUpdateFollowers = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Found " . count($toUpdateFollowers) . " follower IDs to update.\n";

foreach ($toUpdateFollowers as $row) {
    $pdo->prepare("UPDATE projects SET follower_id = ? WHERE id = ?")
        ->execute([$row['new_follower_id'], $row['project_id']]);
}

echo "Migration completed.\n";
?>
