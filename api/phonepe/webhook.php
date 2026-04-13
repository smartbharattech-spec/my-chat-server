// api/phonepe/webhook.php
$configPath = '../config.php';
if (file_exists($configPath)) {
require_once $configPath;
}


// Log the request for debugging
$logFile = 'webhook_log.txt';
$input = file_get_contents('php://input');
file_put_contents($logFile, date('Y-m-d H:i:s') . " - " . $input . PHP_EOL, FILE_APPEND);

// PhonePe sends the status in a base64 encoded JSON in the 'response' field or as raw JSON
$data = json_decode($input, true);

if (isset($data['response'])) {
$response = json_decode(base64_decode($data['response']), true);

if (isset($response['success']) && $response['success'] === true) {
$transactionId = $response['data']['merchantTransactionId'];
$code = $response['code'];

if ($code === 'PAYMENT_SUCCESS') {
// Process successful payment
$parts = explode('_', $transactionId);
$type = $parts[0] ?? '';
$db_id = $parts[1] ?? '';

if ($db_id && $type) {
global $pdo;
if ($type === 'PLAN') {
$stmt = $pdo->prepare("UPDATE payments SET status = 'Completed' WHERE id = ?");
$stmt->execute([$db_id]);
            } elseif ($type === 'MAP') {
                $stmt = $pdo->prepare("UPDATE map_requests SET status = 'paid' WHERE id = ?");
                $stmt->execute([$db_id]);
            } elseif ($type === 'OCCULT') {
                // Update marketplace_orders table
                $stmt = $pdo->prepare("UPDATE marketplace_orders SET status = 'paid', payment_status = 'completed' WHERE id = ?");
                $stmt->execute([$db_id]);

                require_once '../marketplace/wallet_helper.php';
                processOrderCommission($pdo, $db_id);

                // --- Automate Stock Reduction ---
                $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM marketplace_order_items WHERE order_id = ?");
                $itemStmt->execute([$db_id]);
                $items = $itemStmt->fetchAll();

                if ($items) {
                    foreach ($items as $item) {
                        $qty = (int)$item['quantity'];
                        $pid = (int)$item['product_id'];
                        $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND manage_stock = 1")
                            ->execute([$qty, $pid]);
                    }
                } else {
                    $oStmt = $pdo->prepare("SELECT product_id FROM marketplace_orders WHERE id = ?");
                    $oStmt->execute([$db_id]);
                    $order = $oStmt->fetch();
                    if ($order && !empty($order['product_id'])) {
                        $pid = (int)$order['product_id'];
                        $pdo->prepare("UPDATE marketplace_products SET stock_quantity = GREATEST(0, stock_quantity - 1) WHERE id = ? AND manage_stock = 1")
                            ->execute([$pid]);
                    }
                }
            }
}
}
}
}

// PhonePe expects a 200 OK response
http_response_code(200);
echo "OK";
?>