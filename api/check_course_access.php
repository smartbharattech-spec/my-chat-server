<?php
require_once 'config.php';

$user_id = $_GET['user_id'] ?? null;
$course_id = $_GET['course_id'] ?? null;

if (!$user_id || !$course_id) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

try {
    // Check standard course_purchases table
    $stmt = $pdo->prepare("SELECT payment_status FROM course_purchases WHERE user_id = ? AND course_id = ? AND (payment_status = 'approved' OR payment_status = 'completed')");
    $stmt->execute([$user_id, $course_id]);
    $purchase = $stmt->fetch();

    if ($purchase) {
        echo json_encode(["status" => "success", "access" => true]);
        exit;
    }

    // Also check marketplace_orders table for course purchases
    $stmtMarket = $pdo->prepare("
        SELECT id FROM marketplace_orders 
        WHERE user_id = ? AND product_id = ? AND product_type = 'course' AND (status = 'paid' OR status = 'delivered')
    ");
    $stmtMarket->execute([$user_id, $course_id]);
    if ($stmtMarket->fetch()) {
        echo json_encode(["status" => "success", "access" => true]);
        exit;
    }

    echo json_encode(["status" => "success", "access" => false]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
