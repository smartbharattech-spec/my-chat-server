<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = $data['user_id'] ?? null;
$course_id = $data['course_id'] ?? null;
$lesson_id = $data['lesson_id'] ?? null;

if (!$user_id || !$course_id || !$lesson_id) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

try {
    // Insert if not exists (using IGNORE or duplicate key handling)
    $stmt = $pdo->prepare("INSERT IGNORE INTO course_progress (user_id, course_id, lesson_id) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $course_id, $lesson_id]);
    
    echo json_encode(["status" => "success", "message" => "Progress updated"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
