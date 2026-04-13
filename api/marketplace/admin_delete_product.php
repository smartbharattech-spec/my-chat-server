<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);
$product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$admin_id = isset($data['admin_id']) ? (int)$data['admin_id'] : 0;

if (!$product_id || !$admin_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
    exit;
}

try {
    // Verify admin
    $checkAdmin = $pdo->prepare("SELECT role FROM marketplace_users WHERE id = ?");
    $checkAdmin->execute([$admin_id]);
    $admin = $checkAdmin->fetch();

    if (!$admin || $admin['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }

    // Soft delete product by setting status to 'deleted'
    // This resolves foreign key constraint issues with existing orders
    $stmt = $pdo->prepare("UPDATE marketplace_products SET status = 'deleted' WHERE id = ?");
    $success = $stmt->execute([$product_id]);

    if ($success) {
        echo json_encode(['status' => 'success', 'message' => 'Product deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete product']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
