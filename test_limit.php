<?php
require_once 'api/config.php';

// Test variables
$testEmail = 'test_limit_user@myvastutool.com';
$planId = 9999;
$planTitle = 'Test Subscription 7';
$planCredits = 7;

// 1. Cleanup old test data
$pdo->exec("DELETE FROM users WHERE email = '$testEmail'");
$pdo->exec("DELETE FROM projects WHERE email = '$testEmail'");
$pdo->exec("DELETE FROM plans WHERE id = $planId");

// 2. Insert Test Plan (Limit 7)
$stmt = $pdo->prepare("INSERT INTO plans (id, title, plan_type, credits, price, validity_days, gst_percentage, image_swap, device_limit, is_free) VALUES (?, ?, 'subscription', ?, 100, 30, 0, 0, 1, 0)");
$stmt->execute([$planId, $planTitle, $planCredits]);

// 3. Insert Test User with this plan active
$planActivatedAt = date('Y-m-d H:i:s', strtotime('-1 minute'));
$stmt = $pdo->prepare("INSERT INTO users (firstname, email, password, plan, plan_id, plan_activated_at) VALUES ('TestUser', ?, 'pwd', ?, ?, ?)");
$stmt->execute([$testEmail, $planTitle, $planId, $planActivatedAt]);

echo "Setup complete. Testing Project Creation limit of $planCredits...\n\n";

// 4. Simulate creating projects via the POST logic used in api/projects.php
function attemptCreateProject($email, $projectName)
{
    global $pdo;

    // Fetch user and plan
    $uStmt = $pdo->prepare("SELECT plan, plan_id, plan_expiry, plan_activated_at FROM users WHERE email = ?");
    $uStmt->execute([$email]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    $pStmt = $pdo->prepare("SELECT id, title, plan_type, credits, validity_days FROM plans WHERE id = ? OR title = ?");
    $pStmt->execute([$user['plan_id'] ?? -1, $user['plan'] ?? '']);
    $plan = $pStmt->fetch(PDO::FETCH_ASSOC);

    $userPlanTitle = $user['plan'];
    $userPlanId = $user['plan_id'];

    if ($plan['plan_type'] === 'subscription' && $user['plan_activated_at']) {
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM projects p
            LEFT JOIN plans pl ON p.plan_id = pl.id
            LEFT JOIN plans pl2 ON p.plan_name = pl2.title
            WHERE p.email = ? 
            AND p.created_at >= ?
            AND (pl.plan_type != 'single' OR pl.plan_type IS NULL)
            AND (pl2.plan_type != 'single' OR pl2.plan_type IS NULL)
        ");
        $countStmt->execute([$email, $user['plan_activated_at']]);
    } else {
        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM projects WHERE email = ? AND (plan_id = ? OR plan_name = ?)");
        $countStmt->execute([$email, $userPlanId ?: -1, $userPlanTitle ?: '']);
    }

    $currentProjectsCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // THE CRITICAL CHECK
    if ($currentProjectsCount >= $plan['credits'] && $plan['credits'] > 0) {
        return ["status" => "error", "message" => "Limit block triggered at count $currentProjectsCount"];
    }

    // Insert
    $stmt = $pdo->prepare("INSERT INTO projects (email, project_name, plan_name, plan_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $projectName, $userPlanTitle, $userPlanId]);

    return ["status" => "success", "count_before_insert" => $currentProjectsCount];
}

$successCount = 0;
$blockedCount = 0;

for ($i = 1; $i <= 10; $i++) {
    $res = attemptCreateProject($testEmail, "Test Project $i");
    echo "Attempt $i: {$res['status']} ";
    if ($res['status'] === 'success') {
        echo "(count was {$res['count_before_insert']})\n";
        $successCount++;
    } else {
        echo "({$res['message']})\n";
        $blockedCount++;
    }
}

echo "\nSummary:\n- Allowed: $successCount (Expected: $planCredits)\n- Blocked: $blockedCount\n";
if ($successCount === $planCredits) {
    echo "✅ TEST PASSED: EXACTLY $planCredits PROJECTS ALLOWED.\n";
} else {
    echo "❌ TEST FAILED!\n";
}

// Cleanup
$pdo->exec("DELETE FROM users WHERE email = '$testEmail'");
$pdo->exec("DELETE FROM projects WHERE email = '$testEmail'");
$pdo->exec("DELETE FROM plans WHERE id = $planId");
?>