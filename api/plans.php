<?php
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Auto-repair: Check if followup_enabled column exists
try {
$check = $pdo->query("SHOW COLUMNS FROM plans LIKE 'followup_enabled'");
if ($check->rowCount() === 0) {
$pdo->exec("ALTER TABLE plans ADD COLUMN followup_enabled TINYINT(1) DEFAULT 0 AFTER is_free");
}
} catch (PDOException $e) {
// Silently continue if table doesn't exist yet, it'll be handled in individual cases if needed
}

switch ($method) {
case 'GET':
try {
$stmt = $pdo->query("SELECT * FROM plans ORDER BY id ASC");
$plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($plans as &$plan) {
$plan['features'] = json_decode($plan['features']);
// Decode allowed_tools if it exists, default to empty array or all tools?
// Let's default to null if not set, or empty array.
$plan['allowed_tools'] = isset($plan['allowed_tools']) && $plan['allowed_tools'] ? json_decode($plan['allowed_tools']) :
[];
$plan['is_free'] = isset($plan['is_free']) ? (int) $plan['is_free'] : 0;
$plan['followup_enabled'] = isset($plan['followup_enabled']) ? (int) $plan['followup_enabled'] : 0;
$plan['image_swap'] = isset($plan['image_swap']) ? (int) $plan['image_swap'] : 0;
}
echo json_encode(["status" => "success", "data" => $plans]);
} catch (PDOException $e) {
echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
break;

case 'POST':
// Check if it's a multipart form data (file upload) or JSON
$input = json_decode(file_get_contents("php://input"), true);
if ($input) {
$data = $input;
} else {
$data = $_POST;
}

$id = $data['id'] ?? null;
$title = $data['title'] ?? '';
$price = $data['price'] ?? '';
$credits = $data['credits'] ?? 0;
// Features might come as array (JSON) or string (FormData)
$features = $data['features'] ?? [];
if (is_string($features)) {
// If sent as JSON string in FormData
$decoded = json_decode($features, true);
if (json_last_error() === JSON_ERROR_NONE) {
$features = json_encode($decoded);
} else {
// If it's just a string, keeping it as is.
}
} else {
$features = json_encode($features);
}

// Allowed tools similar logic
$allowed_tools = $data['allowed_tools'] ?? [];
if (is_string($allowed_tools)) {
$decoded = json_decode($allowed_tools, true);
if (json_last_error() === JSON_ERROR_NONE) {
$allowed_tools = json_encode($decoded);
} else {
// Keeping it as is.
}
} else {
$allowed_tools = json_encode($allowed_tools);
}

$color_start = $data['color_start'] ?? '#f97316';
$color_end = $data['color_end'] ?? '#fb923c';
$plan_type = $data['plan_type'] ?? 'single';
$validity_days = $data['validity_days'] ?? 0;
$gst_percentage = $data['gst_percentage'] ?? 18;
$image_swap = (isset($data['image_swap']) && ($data['image_swap'] === '1' || $data['image_swap'] === 1 || $data['image_swap'] === 'true' || $data['image_swap'] === true)) ? 1 : 0;
$device_limit = isset($data['device_limit']) ? (int) $data['device_limit'] : 1;
$is_free = (isset($data['is_free']) && ($data['is_free'] === '1' || $data['is_free'] === 1 || $data['is_free'] === 'true' || $data['is_free'] === true)) ? 1 : 0;
$followup_enabled = (isset($data['followup_enabled']) && ($data['followup_enabled'] === '1' || $data['followup_enabled'] === 1 || $data['followup_enabled'] === 'true' || $data['followup_enabled'] === true)) ? 1 : 0;

// Handle File Upload
$swap_image_url = null;
if (isset($_FILES['swap_image']) && $_FILES['swap_image']['error'] === UPLOAD_ERR_OK) {
$uploadDir = 'uploads/plans/';
if (!is_dir($uploadDir)) {
mkdir($uploadDir, 0777, true);
}
$fileName = time() . '_' . basename($_FILES['swap_image']['name']);
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($_FILES['swap_image']['tmp_name'], $targetPath)) {
$swap_image_url = 'api/' . $targetPath; // Relative path for frontend
}
}

if (!$title || $price === '') {
echo json_encode(["status" => "error", "message" => "Title and Price are required.", "debug" => $data]);
break;
}

try {
if ($id) {
// Update
$sql = "UPDATE plans SET title = ?, price = ?, credits = ?, features = ?, allowed_tools = ?, color_start = ?, color_end
= ?, plan_type = ?, validity_days = ?, gst_percentage = ?, image_swap = ?, device_limit = ?, is_free = ?,
followup_enabled = ?";
$params = [$title, $price, $credits, $features, $allowed_tools, $color_start, $color_end, $plan_type, $validity_days,
$gst_percentage, $image_swap, $device_limit, $is_free, $followup_enabled];

if ($swap_image_url) {
$sql .= ", swap_image_url = ?";
$params[] = $swap_image_url;
}

$sql .= " WHERE id = ?";
$params[] = $id;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
echo json_encode(["status" => "success", "message" => "Plan updated successfully."]);
} else {
// Create
$sql = "INSERT INTO plans (title, price, credits, features, allowed_tools, color_start, color_end, plan_type,
validity_days, gst_percentage, image_swap, device_limit, is_free, followup_enabled, swap_image_url) VALUES (?, ?, ?, ?,
?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$title, $price, $credits, $features, $allowed_tools, $color_start, $color_end, $plan_type,
$validity_days, $gst_percentage, $image_swap, $device_limit, $is_free, $followup_enabled, $swap_image_url]);
echo json_encode(["status" => "success", "message" => "Plan created successfully.", "id" => $pdo->lastInsertId()]);
}
} catch (PDOException $e) {
echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
break;

case 'DELETE':
$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
$ids = $data['ids'] ?? null;

if (!$id && !$ids) {
echo json_encode(["status" => "error", "message" => "ID or IDs are required for deletion."]);
break;
}

try {
if ($ids && is_array($ids)) {
// Bulk Delete
$placeholders = str_repeat('?,', count($ids) - 1) . '?';
$stmt = $pdo->prepare("DELETE FROM plans WHERE id IN ($placeholders)");
$stmt->execute($ids);
echo json_encode(["status" => "success", "message" => count($ids) . " plans deleted successfully."]);
} else {
// Single Delete
$stmt = $pdo->prepare("DELETE FROM plans WHERE id = ?");
$stmt->execute([$id]);
echo json_encode(["status" => "success", "message" => "Plan deleted successfully."]);
}
} catch (PDOException $e) {
echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
break;

default:
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
break;
}
?>