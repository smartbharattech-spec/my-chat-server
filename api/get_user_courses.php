<?php
require_once 'config.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing user_id"]);
    exit;
}

try {
    // 1. Fetch from direct course_purchases table
    $stmt1 = $pdo->prepare("
        SELECT 
            c.id, c.title, c.thumbnail,
            cp.created_at as purchase_date, 
            cp.amount as purchase_price,
            'approved' as status,
            u_exp.name as expert_name,
            (SELECT COUNT(*) FROM course_lessons cl 
             JOIN course_topics ct ON cl.topic_id = ct.id 
             WHERE ct.course_id = c.id) as total_lessons,
            (SELECT COUNT(*) FROM course_progress pro 
             WHERE pro.user_id = ? AND pro.course_id = c.id) as completed_lessons
        FROM course_purchases cp
        JOIN courses c ON cp.course_id = c.id
        JOIN marketplace_users u_exp ON c.expert_id = u_exp.id
        WHERE cp.user_id = ? AND (cp.payment_status = 'approved' OR cp.payment_status = 'completed')
    ");
    $stmt1->execute([$user_id, $user_id]);
    $direct_courses = $stmt1->fetchAll();

    // 2. Fetch from marketplace_orders where product_type is 'course'
    $stmt2 = $pdo->prepare("
        SELECT 
            c.id, c.title, c.thumbnail,
            o.created_at as purchase_date, 
            o.amount as purchase_price,
            o.status,
            u_exp.name as expert_name,
            (SELECT COUNT(*) FROM course_lessons cl 
             JOIN course_topics ct ON cl.topic_id = ct.id 
             WHERE ct.course_id = c.id) as total_lessons,
            (SELECT COUNT(*) FROM course_progress pro 
             WHERE pro.user_id = ? AND pro.course_id = c.id) as completed_lessons
        FROM marketplace_orders o
        JOIN courses c ON o.product_id = c.id
        JOIN marketplace_users u_exp ON o.expert_id = u_exp.id
        WHERE o.user_id = ? AND o.product_type = 'course' AND (o.payment_status = 'completed' OR o.payment_status = 'paid')
    ");
    $stmt2->execute([$user_id, $user_id]);
    $marketplace_courses = $stmt2->fetchAll();

    $all_courses = array_merge($direct_courses, $marketplace_courses);
    
    // Sort by date desc
    usort($all_courses, function($a, $b) {
        return strtotime($b['purchase_date']) - strtotime($a['purchase_date']);
    });
    
    echo json_encode(["status" => "success", "data" => $all_courses]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
