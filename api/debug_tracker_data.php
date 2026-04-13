<?php
require 'c:/xampp/htdocs/myvastutool/api/config.php';

echo "WALLET_TRANSACTIONS SCHEMA:\n";
$stmt3 = $pdo->query("DESCRIBE wallet_transactions");
print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
echo str_repeat("=", 50) . "\n\n";

echo "MARKETPLACE_NOTIFICATIONS SCHEMA:\n";
$stmt3 = $pdo->query("DESCRIBE marketplace_notifications");
print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
echo str_repeat("=", 50) . "\n\n";

// echo "REMEDIES TABLE SCHEMA:\n";
// $stmt3 = $pdo->query("DESCRIBE remedies");
// print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
// echo str_repeat("=", 50) . "\n\n";

$stmt = $pdo->query("SELECT id, project_name, project_data, email, expert_id, follower_id FROM projects ORDER BY id DESC LIMIT 5");
while($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $r['id'] . " | Name: " . $r['project_name'] . " | Expert: " . $r['expert_id'] . "\n";
    $data = json_decode($r['project_data'], true);
    if ($data) {
        if (isset($data['entrances'])) {
            echo "  Entrances: " . count($data['entrances']) . "\n";
            foreach($data['entrances'] as $e) {
                if (isset($e['remedy']) || isset($e['customRemedy'])) {
                    echo "    - " . ($e['category'] ?? 'Item') . " (Zone: " . ($e['zone'] ?? 'N/A') . "): " . ($e['remedy'] ?? $e['customRemedy'] ?? 'No Remedy') . "\n";
                }
            }
        }
        if (isset($data['customZoneRemedies'])) {
            echo "  CustomZoneRemedies: " . count($data['customZoneRemedies']) . "\n";
            foreach($data['customZoneRemedies'] as $cz) {
                echo "    - " . implode(',', $cz['zones'] ?? []) . ": " . ($cz['remedy'] ?? 'No Remedy') . "\n";
            }
        }
        // Check for other potential keys
        $otherKeys = array_diff(array_keys($data), ['entrances', 'customZoneRemedies', 'points', 'rotation', 'zoom', 'pan', 'image']);
        if (!empty($otherKeys)) {
            echo "  Other Keys: " . implode(', ', $otherKeys) . "\n";
        }
    }
    echo str_repeat("-", 50) . "\n";
}

$stmt2 = $pdo->query("SELECT * FROM tracker_submissions ORDER BY id DESC LIMIT 5");
echo "\nLATEST TRACKER SUBMISSIONS:\n";
while($ts = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $ts['id'] . " | Project: " . $ts['project_name'] . " | User: " . $ts['user_email'] . " | RemedyID: " . $ts['remedy_id'] . "\n";
}
?>
