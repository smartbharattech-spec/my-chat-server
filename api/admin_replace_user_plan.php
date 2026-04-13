<?php
require_once 'config.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

$user_id = $data['user_id'] ?? '';
$plan_id = $data['plan_id'] ?? '';

if (empty($user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

try {
    if (empty($plan_id)) {
        // RESET PLAN CASE
        $stmt = $pdo->prepare("UPDATE users SET plan = NULL, plan_id = NULL, plan_expiry = NULL, plan_activated_at = NULL WHERE id = ?");
        if ($stmt->execute([$user_id])) {
            echo json_encode([
                "status" => "success",
                "message" => "User plan has been removed."
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to remove user plan."]);
        }
        exit;
    }

    // 1. Fetch Plan Details
    $stmt = $pdo->prepare("SELECT * FROM plans WHERE id = ?");
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
        echo json_encode(["status" => "error", "message" => "Plan not found."]);
        exit;
    }

    // 2. Calculate Expiry
    $expiry = null;
    if ($plan['plan_type'] === 'subscription' && $plan['validity_days'] > 0) {
        $expiry = date('Y-m-d H:i:s', strtotime("+{$plan['validity_days']} days"));
    }

    // 3. Update User
    $stmt = $pdo->prepare("UPDATE users SET plan = ?, plan_id = ?, plan_expiry = ?, plan_activated_at = NOW() WHERE id = ?");
    if ($stmt->execute([$plan['title'], $plan['id'], $expiry, $user_id])) {
        echo json_encode([
            "status" => "success",
            "message" => "User plan updated to {$plan['title']}.",
            "expiry" => $expiry
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update user plan."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>