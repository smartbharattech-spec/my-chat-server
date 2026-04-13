<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
$product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$action = isset($data['action']) ? $data['action'] : 'import'; // 'import' or 'remove'

if (!$expert_id || !$product_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing expert_id or product_id.']);
    exit;
}

try {
    if ($action === 'import') {
        // Verify product exists and is not already owned by this expert
        $stmt = $pdo->prepare("SELECT expert_id FROM marketplace_products WHERE id = ?");
        $stmt->execute([$product_id]);
        $product = $stmt->fetch();

        if (!$product) {
            echo json_encode(['status' => 'error', 'message' => 'Product not found.']);
            exit;
        }

        if ($product['expert_id'] == $expert_id) {
            echo json_encode(['status' => 'error', 'message' => 'You cannot import your own product.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT IGNORE INTO marketplace_expert_imports (expert_id, product_id) VALUES (?, ?)");
        $stmt->execute([$expert_id, $product_id]);

        echo json_encode(['status' => 'success', 'message' => 'Product imported successfully to your store.']);
    } else {
        $stmt = $pdo->prepare("DELETE FROM marketplace_expert_imports WHERE expert_id = ? AND product_id = ?");
        $stmt->execute([$expert_id, $product_id]);
        echo json_encode(['status' => 'success', 'message' => 'Product removed from your store.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
