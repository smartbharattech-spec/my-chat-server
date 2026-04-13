<?php
/* ================= DB CONFIG ================= */// Database connection
require_once 'config.php';

/* ================= INPUT ================= */
$data = json_decode(file_get_contents("php://input"), true);

$action = $data['action'] ?? 'fetch';
$email = $data['email'] ?? '';

if (!$email) {
    echo json_encode(["status" => false, "message" => "Email required"]);
    exit;
}

if ($action === "clear_plan") {
    try {
        $stmt = $pdo->prepare("UPDATE users SET plan = NULL, plan_id = NULL, plan_expiry = NULL, plan_activated_at = NULL WHERE email = ?");
        $stmt->execute([$email]);
        echo json_encode(["status" => true, "message" => "Plan cleared successfully"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => false, "message" => $e->getMessage()]);
    }
    exit;
}

/* ================= FETCH USER ================= */
if ($action === "fetch") {

    $stmt = $pdo->prepare(
        "SELECT u.id, u.firstname, u.email, u.mobile, u.whatsapp, u.city, u.state, u.plan, u.plan_id, u.plan_expiry, u.plan_activated_at, u.is_consultant, u.is_verified,
                COALESCE(p.plan_type, p2.plan_type) as plan_type,
                COALESCE(p.credits, p2.credits) as plan_credits
         FROM users u 
         LEFT JOIN plans p ON u.plan_id = p.id 
         LEFT JOIN plans p2 ON u.plan = p2.title 
         WHERE u.email = ? LIMIT 1"
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $project_count = 0;
        if ($user['plan_type'] === 'subscription' && $user['plan_activated_at']) {
            // Count projects created after activation, BUT EXCLUDE those that are tied to a SINGLE PLAN purchase
            // We check if the project's assigned plan is 'single'
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
            $cStmt->execute([$email, $user['plan_activated_at']]);
            $project_count = $cStmt->fetch(PDO::FETCH_ASSOC)['count'];
        } elseif ($user['plan_id'] || $user['plan']) {
            // For single purchase primary plan (rare case where user ONLY has a single plan as their "active" plan)
            $cStmt = $pdo->prepare("SELECT COUNT(*) as count FROM projects WHERE email = ? AND (plan_id = ? OR plan_name = ?)");
            $cStmt->execute([$email, $user['plan_id'] ?? -1, $user['plan'] ?? '']);
            $project_count = $cStmt->fetch(PDO::FETCH_ASSOC)['count'];
        }
        $user['project_count_current_cycle'] = (int)$project_count;

        // Fetch plan credits if not already there
        if ($user['plan_id'] || $user['plan']) {
            $pStmt = $pdo->prepare("SELECT credits FROM plans WHERE id = ? OR title = ?");
            $pStmt->execute([$user['plan_id'] ?? -1, $user['plan'] ?? '']);
            $pData = $pStmt->fetch(PDO::FETCH_ASSOC);
            $user['plan_credits'] = isset($pData['credits']) ? (int)$pData['credits'] : 0;
        }

        // Count available (unused) single purchase slots
        $sStmt = $pdo->prepare("SELECT plan, plan_id FROM payments WHERE email = ? AND status = 'Active' AND purchase_type = 'single_purchase' AND project_id IS NULL");
        $sStmt->execute([$email]);
        $unused = $sStmt->fetchAll(PDO::FETCH_ASSOC);
        $user['available_single_slots'] = count($unused);
        $user['unused_single_plans'] = $unused;

        // Count used single purchase slots
        $usedStmt = $pdo->prepare("SELECT COUNT(*) as count FROM payments WHERE email = ? AND status = 'Active' AND purchase_type = 'single_purchase' AND project_id IS NOT NULL");
        $usedStmt->execute([$email]);
        $user['used_single_slots'] = $usedStmt->fetch(PDO::FETCH_ASSOC)['count'];

        echo json_encode([
            "status" => true,
            "data" => $user
        ]);
    } else {
        echo json_encode([
            "status" => false,
            "message" => "User not found"
        ]);
    }
    exit;
}

/* ================= UPDATE USER ================= */
if ($action === "update") {

    $firstname = trim($data["firstname"] ?? "");
    $mobile = trim($data["mobile"] ?? "");
    $whatsapp = trim($data["whatsapp"] ?? "");
    $city = trim($data["city"] ?? "");
    $state = trim($data["state"] ?? "");
    $password = trim($data["password"] ?? "");

    if ($firstname === "") {
        echo json_encode([
            "status" => false,
            "message" => "First name required"
        ]);
        exit;
    }

    if ($password !== "") {
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare(
            "UPDATE users SET firstname = ?, mobile = ?, whatsapp = ?, city = ?, state = ?, password = ? WHERE email = ?"
        );
        $stmt->execute([$firstname, $mobile, $whatsapp, $city, $state, $hash, $email]);
    } else {
        $stmt = $pdo->prepare(
            "UPDATE users SET firstname = ?, mobile = ?, whatsapp = ?, city = ?, state = ? WHERE email = ?"
        );
        $stmt->execute([$firstname, $mobile, $whatsapp, $city, $state, $email]);
    }

    echo json_encode([
        "status" => true,
        "message" => "Profile updated successfully"
    ]);
    exit;
}

/* ================= INVALID ================= */
echo json_encode([
    "status" => false,
    "message" => "Invalid request"
]);
