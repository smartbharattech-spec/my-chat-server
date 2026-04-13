<?php
header("Content-Type: application/json");
require_once 'api/config.php';

// Get a project that has customZoneRemedies or entrances with remedies
$stmt = $pdo->query("SELECT id, project_name, project_data FROM projects WHERE project_data IS NOT NULL AND project_data != '{}' LIMIT 5");
$projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($projects as $p) {
    $data = json_decode($p['project_data'], true);
    $keys = array_keys($data ?? []);
    $result[] = [
        'id' => $p['id'],
        'name' => $p['project_name'],
        'keys_in_project_data' => $keys,
        'entrances_count' => count($data['entrances'] ?? []),
        'customZoneRemedies_count' => count($data['customZoneRemedies'] ?? []),
        'sample_entrance' => isset($data['entrances'][0]) ? $data['entrances'][0] : null,
        'sample_czr' => isset($data['customZoneRemedies'][0]) ? $data['customZoneRemedies'][0] : null,
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
