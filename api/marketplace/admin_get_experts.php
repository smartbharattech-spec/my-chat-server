<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT m.id, m.name, m.email, m.phone, m.status, m.is_online, m.is_blocked, m.created_at,
               e.primary_skill, e.experience_years, e.verification_document, e.expert_type, 
               e.is_verified, e.is_visible, e.is_live, e.rating,
               e.ai_exam_status, e.ai_exam_marks, e.ai_exam_remarks, e.ai_exam_data, 
               e.admin_interview_questions, e.expertise_tags, e.custom_details, 
               e.intro_video_url, e.interview_status, e.profile_image
        FROM marketplace_users m
        LEFT JOIN expert_profiles e ON m.id = e.user_id
        WHERE m.role = 'expert'
        ORDER BY m.created_at DESC
    ");
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $experts]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
