<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$order_id = isset($data['order_id']) ? (int)$data['order_id'] : 0;
$admin_id = isset($data['admin_id']) ? (int)$data['admin_id'] : 0;

if (!$order_id || !$admin_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required details.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Fetch order details
    $stmt = $pdo->prepare("SELECT * FROM marketplace_orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch();

    if (!$order) {
        throw new Exception("Order not found.");
    }

    if ($order['payment_status'] === 'completed') {
        throw new Exception("Order is already paid.");
    }

    // Update status to 'paid' and 'completed'
    $stmt = $pdo->prepare("UPDATE marketplace_orders SET status = 'paid', payment_status = 'completed' WHERE id = ?");
    $stmt->execute([$order_id]);

    // COMMISSION LOGIC
    require_once 'wallet_helper.php';
    processOrderCommission($pdo, $order_id);

    // --- Automate Stock Reduction ---
    // 1. Check if there are multiple items in marketplace_order_items
    $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM marketplace_order_items WHERE order_id = ?");
    $itemStmt->execute([$order_id]);
    $items = $itemStmt->fetchAll();

    if ($items) {
        foreach ($items as $item) {
            $qty = (int)$item['quantity'];
            $pid = (int)$item['product_id'];
            $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND manage_stock = 1")
                ->execute([$qty, $pid]);
        }
    } else if (!empty($order['product_id'])) {
        // 2. Fallback to single product_id in marketplace_orders
        $pid = (int)$order['product_id'];
        $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - 1) WHERE id = ? AND manage_stock = 1")
            ->execute([$pid]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Order approved successfully.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Failed to approve order: ' . $e->getMessage()]);
}
?>
