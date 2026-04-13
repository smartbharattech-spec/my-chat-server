<?php
define('NO_JSON_HEADER', true);
require_once 'config.php';

header("Content-Type: application/json");

// Check if file was uploaded
if (!isset($_FILES['map'])) {
    echo json_encode(["status" => "error", "message" => "No file uploaded"]);
    exit;
}

$project_id = $_POST['project_id'] ?? null;
$email = $_POST['email'] ?? null;

if (!$project_id || !$email) {
    echo json_encode(["status" => "error", "message" => "Project ID and Email are required"]);
    exit;
}

$file = $_FILES['map'];
$target_dir = "uploads/maps/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

// Generate unique filename
$file_extension = pathinfo($file["name"], PATHINFO_EXTENSION);
if (empty($file_extension)) $file_extension = 'webp'; // Default for compressed blobs

$filename = "map_" . $project_id . "_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $file_extension;
$target_file = $target_dir . $filename;

// Check if image file is an actual image
$check = getimagesize($file["tmp_name"]);
if ($check === false) {
    echo json_encode(["status" => "error", "message" => "File is not an image"]);
    exit;
}

// Check file size (limit 15MB for maps)
if ($file["size"] > 15000000) {
    echo json_encode(["status" => "error", "message" => "File is too large (max 15MB)"]);
    exit;
}

if (move_uploaded_file($file["tmp_name"], $target_file)) {
    try {
        // 1. Get old image to delete it
        $stmt = $pdo->prepare("SELECT map_image FROM projects WHERE id = ?");
        $stmt->execute([$project_id]);
        $old_res = $stmt->fetch();
        
        // 2. Update projects table
        $updateStmt = $pdo->prepare("UPDATE projects SET map_image = ? WHERE id = ?");
        $updateStmt->execute([$filename, $project_id]);
        
        // 3. Delete old file if exists
        if ($old_res && !empty($old_res['map_image'])) {
            $old_file_path = $target_dir . $old_res['map_image'];
            if (file_exists($old_file_path)) {
                @unlink($old_file_path);
            }
        }
        
        $relative_url = "api/uploads/maps/" . $filename;
        
        echo json_encode([
            "status" => "success", 
            "message" => "Map uploaded and linked successfully",
            "filename" => $filename,
            "url" => $relative_url
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Error moving uploaded file"]);
}
?>
