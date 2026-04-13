<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$experience = isset($data['experience']) ? (int)$data['experience'] : 0;
$expertise = isset($data['expertise']) ? $data['expertise'] : '';
$custom_details = isset($data['custom_details']) ? $data['custom_details'] : '';
$video_url = isset($data['video_url']) ? $data['video_url'] : '';

if ($user_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid user ID.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE expert_profiles 
        SET experience_years = ?, 
            expertise_tags = ?, 
            custom_details = ?, 
            intro_video_url = ?,
            ai_exam_status = 'pending'
        WHERE user_id = ?
    ");
    $stmt->execute([$experience, $expertise, $custom_details, $video_url, $user_id]);

    echo json_encode(['status' => 'success', 'message' => 'Preliminary information saved.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
