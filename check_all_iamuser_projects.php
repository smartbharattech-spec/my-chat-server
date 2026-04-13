<?php
require_once 'api/config.php';
$search = 'iamuser';
$stmt = $pdo->prepare("SELECT id, project_name, email, follower_id, expert_id, project_data FROM projects WHERE project_name LIKE ? OR email LIKE ?");
$stmt->execute(["%$search%", "%$search%"]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($res as $r) {
    echo "ID: " . $r['id'] . " | Name: " . $r['project_name'] . " | Email: " . $r['email'] . " | Follower: " . $r['follower_id'] . "\n";
    $data = json_decode($r['project_data'], true);
    $found = 0;
    if (isset($data['entrances'])) {
        foreach($data['entrances'] as $ent) if (!empty($ent['remedy'] ?? $ent['customRemedy'] ?? '')) $found++;
    }
    if (isset($data['customZoneRemedies'])) {
        foreach($data['customZoneRemedies'] as $rem) if (!empty($rem['remedy'] ?? '')) $found++;
    }
    echo "  => Remedies in data: $found\n";
}
?>
