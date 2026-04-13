<?php
require_once 'config.php';
header("Content-Type: text/plain");

$email = 'rohitsha2442@gmail.com';

echo "--- User Record ---\n";
$stmt = $pdo->prepare("SELECT email, plan, plan_id, plan_activated_at FROM users WHERE email = ?");
$stmt->execute([$email]);
print_r($stmt->fetch(PDO::FETCH_ASSOC));

echo "\n--- Payment Record ---\n";
$stmt = $pdo->prepare("SELECT id, email, plan, status, purchase_type, project_id FROM payments WHERE email = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$email]);
print_r($stmt->fetch(PDO::FETCH_ASSOC));

echo "\n--- Projects Table ---\n";
$stmt = $pdo->prepare("SELECT id, project_name, email, plan_id, followup_status, assigned_admin_id FROM projects WHERE email = ?");
$stmt->execute([$email]);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Follow-up Assignments API Logic Check ---\n";
// This is what the frontend calls: /api/followup_assignments.php?action=list_pending
$sql = "SELECT p.id, p.project_name, p.email, p.plan_name, p.created_at 
        FROM projects p 
        WHERE p.followup_status = 'pending' 
        AND p.assigned_admin_id IS NULL";
$stmt = $pdo->query($sql);
echo "Current Pending Count in System: " . $stmt->rowCount() . "\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
