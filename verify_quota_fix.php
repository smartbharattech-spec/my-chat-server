<?php
require 'api/config.php';

echo "--- VERIFYING QUOTA FIX (NO RESET ON SINGLE PURCHASE) ---\n";

$testEmail = 'fix_verification@example.com';

// 0. Cleanup
$pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$testEmail]);
$pdo->prepare("DELETE FROM payments WHERE email = ?")->execute([$testEmail]);
$pdo->prepare("DELETE FROM projects WHERE email = ?")->execute([$testEmail]);

// 1. Create a user with a subscription (2 projects limit)
// Assume Plan ID 1 is 'Marma & Devata Basic' (subscription)
$activationDate = '2026-01-01 10:00:00';
$pdo->prepare("INSERT INTO users (email, plan, plan_id, plan_activated_at) VALUES (?, 'Marma & Devata Basic', 1, ?)")->execute([$testEmail, $activationDate]);

echo "Initial Activation Date: $activationDate\n";

// 2. Create 2 projects covered by subscription
$pdo->prepare("INSERT INTO projects (email, project_name, created_at) VALUES (?, 'Sub Project 1', '2026-01-02 10:00:00')")->execute([$testEmail]);
$pdo->prepare("INSERT INTO projects (email, project_name, created_at) VALUES (?, 'Sub Project 2', '2026-01-03 10:00:00')")->execute([$testEmail]);

// 3. Mock a Single Plan Payment (Plan ID 2: Complete Details - single_purchase)
$pdo->prepare("INSERT INTO payments (email, plan, plan_id, status, purchase_type, project_details) VALUES (?, 'Complete Details', 2, 'Pending', 'single_purchase', '{\"project_name\":\"Single Project\"}')")->execute([$testEmail]);
$paymentId = $pdo->lastInsertId();

echo "Simulating payment approval for Single Plan (ID: $paymentId)...\n";

// 4. Run approval logic (simulate POST to approve_payment.php)
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['payment_id'] = $paymentId;
$_POST['status'] = 'Active';
include 'api/approve_payment.php';
echo "\n";

// 5. Check if User's plan_activated_at was updated (IT SHOULD NOT BE)
$stmt = $pdo->prepare("SELECT plan_activated_at, plan FROM users WHERE email = ?");
$stmt->execute([$testEmail]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Final Activation Date: {$user['plan_activated_at']}\n";
echo "Active Global Plan: {$user['plan']}\n";

if ($user['plan_activated_at'] === $activationDate) {
    echo "✅ SUCCESS: Quota date NOT reset by single purchase.\n";
} else {
    echo "❌ FAILED: Quota date WAS reset. Old: $activationDate, New: {$user['plan_activated_at']}\n";
}

// 6. Verify dashboard counting logic (from user_profile.php)
echo "Verifying project count logic...\n";
$cStmt = $pdo->prepare("
    SELECT COUNT(*) as count 
    FROM projects p
    LEFT JOIN plans pl ON p.plan_id = pl.id
    LEFT JOIN plans pl2 ON p.plan_name = pl2.title
    WHERE p.email = ? 
    AND p.created_at >= ?
    AND (pl.plan_type != 'single' OR pl.plan_type IS NULL)
    AND (pl2.plan_type != 'single' OR pl2.plan_type IS NULL)
");
$cStmt->execute([$testEmail, $user['plan_activated_at']]);
$count = $cStmt->fetch(PDO::FETCH_ASSOC)['count'];

echo "Subscription Project Count: $count (Expected: 2)\n";
if ($count == 2) {
    echo "✅ SUCCESS: Single plan project correctly excluded from usage count.\n";
} else {
    echo "❌ FAILED: Exclusions failed.\n";
}

// Cleanup
$pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$testEmail]);
$pdo->prepare("DELETE FROM payments WHERE email = ?")->execute([$testEmail]);
$pdo->prepare("DELETE FROM projects WHERE email = ?")->execute([$testEmail]);
?>