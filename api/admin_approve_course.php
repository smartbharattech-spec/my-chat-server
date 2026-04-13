<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $purchase_id = $_POST['purchase_id'] ?? null;
    $status = $_POST['status'] ?? 'approved'; // approved or rejected

    if (!$purchase_id) {
        echo json_encode(["status" => "error", "message" => "Purchase ID is required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE course_purchases SET payment_status = ? WHERE id = ?");
        $stmt->execute([$status, $purchase_id]);
        
        echo json_encode(["status" => "success", "message" => "Course purchase $status."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
