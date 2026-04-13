<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT id, project_name, email, follower_id, expert_id, project_data FROM projects");
while ($r = $stmt->fetch()) {
    $data = json_decode($r['project_data'], true);
    $found = 0;
    if (isset($data['entrances'])) {
        foreach($data['entrances'] as $ent) if (!empty($ent['remedy'] ?? $ent['customRemedy'] ?? '')) $found++;
    }
    if (isset($data['customZoneRemedies'])) {
        foreach($data['customZoneRemedies'] as $rem) if (!empty($rem['remedy'] ?? '')) $found++;
    }
    if ($found > 0) {
        echo "REMEDIES FOUND IN ID: " . $r['id'] . " | Name: " . $r['project_name'] . " | Email: " . $r['email'] . " | Follower: " . $r['follower_id'] . " | Count: $found\n";
    }
}
?>
