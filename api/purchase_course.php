<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = JSON_DECODE(FILE_GET_CONTENTS('php://input'), true);
    
    $user_id = $data['user_id'] ?? null;
    $course_id = $data['course_id'] ?? null;
    $payment_method = $data['payment_method'] ?? 'Manual';
    $transaction_id = $data['transaction_id'] ?? '';
    $amount = $data['amount'] ?? 0;

    if (!$user_id || !$course_id) {
        echo json_encode(["status" => "error", "message" => "Invalid Data"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO course_purchases (user_id, course_id, amount, payment_method, transaction_id, payment_status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$user_id, $course_id, $amount, $payment_method, $transaction_id]);
        
        echo json_encode(["status" => "success", "message" => "Purchase submitted. Waiting for admin approval."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
