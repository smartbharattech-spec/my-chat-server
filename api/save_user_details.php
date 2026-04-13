<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

$email = $data['email'] ?? '';
$projectId = $data['project_id'] ?? null;
$name = $data['name'] ?? '';
$north_tilt = $data['north_tilt'] ?? '';
$facing = $data['facing'] ?? '';
$time_living = $data['time_living'] ?? '';
$profession = $data['profession'] ?? '';
$main_gate = $data['main_gate'] ?? '';
$kitchen = $data['kitchen'] ?? '';
$mandir = $data['mandir'] ?? '';
$toilet = $data['toilet'] ?? '';
$septic_tank = $data['septic_tank'] ?? '';
$house_type = $data['house_type'] ?? '';

$location_coords = $data['location_coords'] ?? '';
$north_tilt_tool = $data['north_tilt_tool'] ?? '';

if (!$email && !$projectId) {
    echo json_encode(["status" => "error", "message" => "Email or Project ID is required"]);
    exit;
}

try {
    // Check if record exists for this project_id or email
    if ($projectId) {
        $stmtCheck = $pdo->prepare("SELECT id FROM user_property_details WHERE project_id = ? LIMIT 1");
        $stmtCheck->execute([$projectId]);
    } else {
        $stmtCheck = $pdo->prepare("SELECT id FROM user_property_details WHERE email = ? AND project_id IS NULL LIMIT 1");
        $stmtCheck->execute([$email]);
    }
    $existing = $stmtCheck->fetch();

    if ($existing) {
        // Update
        $stmt = $pdo->prepare("UPDATE user_property_details SET 
            location_coords = ?, name = ?, north_tilt = ?, north_tilt_tool = ?, facing = ?, time_living = ?, profession = ?, 
            main_gate = ?, kitchen = ?, mandir = ?, toilet = ?, septic_tank = ?, house_type = ?, email = ?, project_id = ?
            WHERE id = ?");
        $stmt->execute([
            $location_coords,
            $name,
            $north_tilt,
            $north_tilt_tool,
            $facing,
            $time_living,
            $profession,
            $main_gate,
            $kitchen,
            $mandir,
            $toilet,
            $septic_tank,
            $house_type,
            $email,
            $projectId,
            $existing['id']
        ]);
        echo json_encode(["status" => "success", "message" => "Details updated successfully"]);
    } else {
        // Insert
        $stmt = $pdo->prepare("INSERT INTO user_property_details 
            (email, project_id, location_coords, name, north_tilt, north_tilt_tool, facing, time_living, profession, main_gate, kitchen, mandir, toilet, septic_tank, house_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $email,
            $projectId,
            $location_coords,
            $name,
            $north_tilt,
            $north_tilt_tool,
            $facing,
            $time_living,
            $profession,
            $main_gate,
            $kitchen,
            $mandir,
            $toilet,
            $septic_tank,
            $house_type
        ]);
        echo json_encode(["status" => "success", "message" => "Details saved successfully"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>