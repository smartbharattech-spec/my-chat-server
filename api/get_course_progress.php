<?php
require_once 'config.php';

$user_id = $_GET['user_id'] ?? null;
$course_id = $_GET['course_id'] ?? null;

if (!$user_id || !$course_id) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT lesson_id FROM course_progress WHERE user_id = ? AND course_id = ?");
    $stmt->execute([$user_id, $course_id]);
    $completed = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "completed_lessons" => $completed]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
