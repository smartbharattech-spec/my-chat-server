<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT cp.*, u.name as user_name, u.email as user_email, c.title as course_title 
                         FROM course_purchases cp 
                         JOIN marketplace_users u ON cp.user_id = u.id 
                         JOIN courses c ON cp.course_id = c.id 
                         ORDER BY cp.created_at DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $data]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
