<?php
require_once 'api/config.php';
$email = 'iamuser@gmail.com';
$stmt = $pdo->prepare("SELECT id, project_name, follower_id, email, project_data FROM projects WHERE email = ? OR follower_id = 20");
$stmt->execute([$email]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($res as $r) {
    echo "ID: " . $r['id'] . " | Name: " . $r['project_name'] . " | Follower: " . $r['follower_id'] . " | Email: " . $r['email'] . "\n";
    // Check for remedies in data
    $data = json_decode($r['project_data'], true);
    $found = 0;
    if (isset($data['entrances'])) {
        foreach($data['entrances'] as $ent) if (!empty($ent['remedy'] ?? $ent['customRemedy'] ?? '')) $found++;
    }
    if (isset($data['customZoneRemedies'])) {
        foreach($data['customZoneRemedies'] as $rem) if (!empty($rem['remedy'] ?? '')) $found++;
    }
    echo "  => Remedies found in data: $found\n";
    
    // Check if synced in tracker_submissions
    $tStmt = $pdo->prepare("SELECT COUNT(*) FROM tracker_submissions WHERE project_id = ?");
    $tStmt->execute([$r['id']]);
    echo "  => Tracker submissions in DB: " . $tStmt->fetchColumn() . "\n";
}
?>
