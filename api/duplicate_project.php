<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$project_id = $data['project_id'] ?? null;
$email = $data['email'] ?? null; // Logged in user's email

if (!$project_id || !$email) {
    echo json_encode(["status" => "error", "message" => "Project ID and Email are required."]);
    exit;
}

try {
    $folder_id = $data['folder_id'] ?? null;
    if ($folder_id === 'root' || $folder_id === '') $folder_id = null;

    // 1. Fetch the Original Project
    // We check if the email matches OR if the user is an expert/follower on this project
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$project_id]);
    $original = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$original) {
        echo json_encode(["status" => "error", "message" => "Original project not found."]);
        exit;
    }

    // Security Check: Ensure the user has access to this project
    // (Either owner, expert, or follower)
    $hasAccess = ($original['email'] === $email);
    if (!$hasAccess) {
        // Check if user is expert or follower via IDs
        $uStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? UNION SELECT id FROM marketplace_users WHERE email = ?");
        $uStmt->execute([$email, $email]);
        $uIds = $uStmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($uIds)) {
            if (in_array((int)$original['expert_id'], $uIds) || in_array((int)$original['follower_id'], $uIds)) {
                $hasAccess = true;
            }
        }
    }

    if (!$hasAccess) {
        echo json_encode(["status" => "error", "message" => "Access denied. You cannot duplicate this project."]);
        exit;
    }

    // 2. CHECK LIMITS
    $uStmt = $pdo->prepare("SELECT plan, plan_id, plan_expiry, plan_activated_at FROM users WHERE email = ?");
    $uStmt->execute([$email]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    $plan = null;
    if ($user && ($user['plan_id'] || $user['plan'])) {
        $pStmt = $pdo->prepare("SELECT plan_type, credits, validity_days FROM plans WHERE id = ? OR title = ?");
        $pStmt->execute([$user['plan_id'] ?? -1, $user['plan'] ?? '']);
        $plan = $pStmt->fetch(PDO::FETCH_ASSOC);
    }

    if ($user && ($user['plan_id'] || $user['plan']) && $plan) {
        $userPlanId = $user['plan_id'];
        $userPlanTitle = $user['plan'];

        if ($plan['plan_type'] === 'subscription' && $user['plan_activated_at']) {
            $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM projects WHERE email = ? AND created_at >= ?");
            $countStmt->execute([$email, $user['plan_activated_at']]);
        } else {
            $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM projects WHERE email = ? AND (plan_id = ? OR plan_name = ?)");
            $countStmt->execute([$email, $userPlanId ?: -1, $userPlanTitle ?: '']);
        }

        $currentCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
        if ($currentCount >= $plan['credits'] && $plan['credits'] > 0) {
            echo json_encode(["status" => "error", "message" => "Limit Reached: Cannot duplicate. You have reached the project limit (" . $plan['credits'] . ") for your current plan."]);
            exit;
        }
    }

    // 3. Handle Map Image Copy
    $new_map_image = null;
    if (!empty($original['map_image'])) {
        $upload_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'maps' . DIRECTORY_SEPARATOR;
        if (file_exists($upload_dir . $original['map_image'])) {
            $extension = pathinfo($original['map_image'], PATHINFO_EXTENSION);
            $new_filename = "map_copy_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $extension;
            if (copy($upload_dir . $original['map_image'], $upload_dir . $new_filename)) {
                $new_map_image = $new_filename;
            }
        }
    }

    // 4. Insert New Project (Include Expert and Follower IDs)
    $new_name = $original['project_name'] . " (Copy)";
    $stmt = $pdo->prepare("INSERT INTO projects 
        (email, expert_id, follower_id, project_name, construction_type, property_type, project_issue, plan_name, plan_id, map_image, project_data, folder_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $original['email'],
        $original['expert_id'],
        $original['follower_id'],
        $new_name,
        $original['construction_type'],
        $original['property_type'],
        $original['project_issue'],
        $original['plan_name'],
        $original['plan_id'],
        $new_map_image,
        $original['project_data'],
        $folder_id
    ]);

    $new_project_id = $pdo->lastInsertId();

    // 5. Duplicate Property & Personal Details
    // Try by project_id first, then fallback to email (for legacy projects)
    $stmtProp = $pdo->prepare("SELECT * FROM user_property_details WHERE project_id = ? OR (email = ? AND project_id IS NULL) ORDER BY created_at DESC LIMIT 1");
    $stmtProp->execute([$project_id, $original['email']]);
    $propDetails = $stmtProp->fetch(PDO::FETCH_ASSOC);

    if ($propDetails) {
        $stmtInsertProp = $pdo->prepare("
            INSERT INTO user_property_details 
            (email, project_id, location_coords, name, north_tilt, north_tilt_tool, facing, time_living, profession, main_gate, kitchen, mandir, toilet, septic_tank, house_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsertProp->execute([
            $original['email'],
            $new_project_id,
            $propDetails['location_coords'],
            $propDetails['name'],
            $propDetails['north_tilt'],
            $propDetails['north_tilt_tool'],
            $propDetails['facing'],
            $propDetails['time_living'],
            $propDetails['profession'],
            $propDetails['main_gate'],
            $propDetails['kitchen'],
            $propDetails['mandir'],
            $propDetails['toilet'],
            $propDetails['septic_tank'],
            $propDetails['house_type']
        ]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Project duplicated successfully as '$new_name'",
        "id" => $new_project_id
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>