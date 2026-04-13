<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$product_id = isset($data['id']) ? (int)$data['id'] : 0;
$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;

if (!$product_id || !$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Product ID and Expert ID are required']);
    exit;
}

try {
    // Soft delete by setting status to 'deleted'
    // This prevents foreign key errors with order history
    $stmt = $pdo->prepare("UPDATE marketplace_products SET status = 'deleted' WHERE id = ? AND expert_id = ?");
    $stmt->execute([$product_id, $expert_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Product deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Product not found or unauthorized']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
