<?php
define('NO_JSON_HEADER', true);
include_once 'config.php';

header("Content-Type: application/json");

// Check if file was uploaded
if (!isset($_FILES['banner'])) {
    echo json_encode(["status" => "error", "message" => "No file uploaded"]);
    exit;
}

$file = $_FILES['banner'];
$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

// Generate unique filename
$file_extension = pathinfo($file["name"], PATHINFO_EXTENSION);
$file_name = "tracker_banner_" . time() . "." . $file_extension;
$target_file = $target_dir . $file_name;

// Check if image file is a actual image or fake image
$check = getimagesize($file["tmp_name"]);
if ($check === false) {
    echo json_encode(["status" => "error", "message" => "File is not an image"]);
    exit;
}

// Check file size (limit 5MB)
if ($file["size"] > 5000000) {
    echo json_encode(["status" => "error", "message" => "File is too large (max 5MB)"]);
    exit;
}

// Allow certain file formats
$allowed_types = ["jpg", "jpeg", "png", "webp"];
if (!in_array(strtolower($file_extension), $allowed_types)) {
    echo json_encode(["status" => "error", "message" => "Only JPG, JPEG, PNG & WEBP files are allowed"]);
    exit;
}

if (move_uploaded_file($file["tmp_name"], $target_file)) {
    // Save to settings table
    global $pdo;
    $db = $pdo;
    
    // Relative URL for storage, but we'll return full URL
    $relative_url = "api/uploads/" . $file_name;
    
    try {
        $query = "INSERT INTO settings (setting_key, setting_value) 
                  VALUES ('tracker_banner_url', :url) 
                  ON DUPLICATE KEY UPDATE setting_value = :url";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":url", $relative_url);
        $stmt->execute();
        
        echo json_encode([
            "status" => "success", 
            "message" => "Banner uploaded successfully",
            "url" => $relative_url
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Error uploading file"]);
}
?>
