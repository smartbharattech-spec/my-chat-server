<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->prepare("INSERT INTO projects (email, project_name, plan_name, plan_id, followup_status, followup_start_at) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute(['rohitsha2442@gmail.com', 'Main Project', 'The Follwup plane', 10, 'pending', '2026-02-19 23:44:44']);
    echo "Fixed Rohit successfully.";
} catch (Exception $e) {
    echo "Error fixing Rohit: " . $e->getMessage();
}
