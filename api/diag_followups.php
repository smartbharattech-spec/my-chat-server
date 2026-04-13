<?php
require_once 'api/config.php';
header("Content-Type: text/plain");

echo "--- Admin Followups Master ---\n";
$stmt = $pdo->query("SELECT * FROM admin_followups ORDER BY days_interval ASC");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Accepted Projects ---\n";
$stmt = $pdo->query("SELECT id, project_name, email, followup_status, followup_start_at, assigned_admin_id, last_followup_step FROM projects WHERE followup_status != 'none'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Admin Users ---\n";
$stmt = $pdo->query("SELECT id, username, email FROM admins");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
