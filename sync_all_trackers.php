<?php
require_once 'api/config.php';
require_once 'api/tracker.php';

// Trigger sync for all projects
$stmt = $pdo->query("SELECT id FROM projects WHERE project_data IS NOT NULL");
$projects = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($projects as $projectId) {
    syncProjectRemedies($pdo, $projectId);
}

echo "Sync completed for " . count($projects) . " projects.";
?>
