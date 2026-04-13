<?php
// Database Connection
require_once 'config.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$project_id = $data['project_id'] ?? null;
$plan = $data['plan'] ?? '';
$plan_id = $data['plan_id'] ?? null;
$price = $data['price'] ?? '';
$credits = $data['credits'] ?? 0;
$status = $data['status'] ?? 'Pending';
$purchase_type = $data['purchase_type'] ?? 'new_purchase';
$current_plan = $data['current_plan'] ?? null;
$current_plan_id = $data['current_plan_id'] ?? null;

// RELIABILITY FIX: Fetch plan_type directly from database to ensure purchase_type is correct
try {
    $pStmt = $pdo->prepare("SELECT plan_type FROM plans WHERE id = ? OR title = ? LIMIT 1");
    $pStmt->execute([$plan_id ?? -1, $plan]);
    $dbPlan = $pStmt->fetch(PDO::FETCH_ASSOC);
    if ($dbPlan) {
        if ($dbPlan['plan_type'] === 'single') {
            $purchase_type = 'single_purchase';
        } elseif ($purchase_type !== 'upgrade') {
            $purchase_type = 'new_purchase';
        }
    }
} catch (PDOException $e) {
    // Non-critical, fallback to provided purchase_type
}

$project_details = $data['project_details'] ?? null;

// Validate required fields
if (!$email || !$plan || !$price) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

// Check if a PENDING request for the same plan already exists for this user
try {
    $stmt = $pdo->prepare("SELECT id FROM payments WHERE email = ? AND plan_id = ? AND status = 'Pending' ORDER BY id DESC LIMIT 1");
    $stmt->execute([$email, $plan_id]);
    $existing = $stmt->fetch();

    if ($existing) {
        echo json_encode([
            "status" => "success",
            "message" => "Reusing existing pending request for '$plan'.",
            "id" => $existing['id'],
            "is_reused" => true
        ]);
        exit;
    }
} catch (PDOException $e) {
    // Continue if check fails, not critical
}

// Insert into database
try {
    $stmt = $pdo->prepare("INSERT INTO payments (email, project_id, plan, plan_id, price, credits, status, purchase_type, current_plan, current_plan_id, project_details) VALUES (:email, :project_id, :plan, :plan_id, :price, :credits, :status, :purchase_type, :current_plan, :current_plan_id, :project_details)");
    $stmt->execute([
        'email' => $email,
        'project_id' => $project_id,
        'plan' => $plan,
        'plan_id' => $plan_id,
        'price' => $price,
        'credits' => $credits,
        'status' => $status,
        'purchase_type' => $purchase_type,
        'current_plan' => $current_plan,
        'current_plan_id' => $current_plan_id,
        'project_details' => is_array($project_details) ? json_encode($project_details) : $project_details
    ]);

    $message = "Payment request saved! Please contact support.";
    if ($purchase_type === 'upgrade') {
        $message = "Upgrade request from '$current_plan' to '$plan' saved! Please contact support to complete the upgrade.";
    } elseif ($purchase_type === 'single_purchase') {
        $message = "Single purchase request for '$plan' saved! Please contact support.";
    }

    echo json_encode([
        "status" => "success",
        "message" => $message,
        "id" => $pdo->lastInsertId(),
        "data" => [
            "email" => $email,
            "plan" => $plan,
            "price" => $price,
            "credits" => $credits,
            "status" => $status,
            "purchase_type" => $purchase_type
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database insert failed: " . $e->getMessage()]);
}
