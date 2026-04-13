<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = isset($_GET['admin_id']) ? (int)$_GET['admin_id'] : 0;
$input = json_decode(file_get_contents('php://input'), true);
if ($input && isset($input['admin_id'])) {
    $admin_id = (int)$input['admin_id'];
}

if (!$admin_id) {
    echo json_encode(['status' => 'error', 'message' => 'Admin ID is required.']);
    exit;
}

try {
    // Verify Admin Role
    $stmt = $pdo->prepare("SELECT role FROM marketplace_users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin access required.']);
        exit;
    }

    if ($method === 'GET') {
        // List all requests with user info
        $stmt = $pdo->query("
            SELECT r.*, u.name as user_name, u.phone, p.plan_name 
            FROM marketplace_credit_requests r
            JOIN marketplace_users u ON r.user_id = u.id
            JOIN marketplace_credit_plans p ON r.plan_id = p.id
            ORDER BY r.created_at DESC
        ");
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $requests]);

    } elseif ($method === 'POST') {
        // Approve or Reject request
        if (!$input) $input = $_POST;
        $request_id = isset($input['request_id']) ? (int)$input['request_id'] : 0;
        $action = isset($input['action']) ? $input['action'] : ''; // 'approve' or 'reject'

        if (!$request_id || !in_array($action, ['approve', 'reject'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid action or request ID.']);
            exit;
        }

        // Fetch the request to verify it's still pending
        $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_requests WHERE id = ?");
        $stmt->execute([$request_id]);
        $request = $stmt->fetch();

        if (!$request) {
            echo json_encode(['status' => 'error', 'message' => 'Request not found.']);
            exit;
        }

        if ($request['status'] !== 'pending') {
            echo json_encode(['status' => 'error', 'message' => 'This request has already been processed.']);
            exit;
        }

        $pdo->beginTransaction();

        try {
            $new_status = ($action === 'approve') ? 'approved' : 'rejected';

            // Update request status
            $stmt = $pdo->prepare("UPDATE marketplace_credit_requests SET status = ? WHERE id = ?");
            $stmt->execute([$new_status, $request_id]);

            if ($action === 'approve') {
                // Determine which ID column to use in marketplace_users to add credits
                $stmt = $pdo->prepare("UPDATE marketplace_users SET credits = COALESCE(credits, 0) + ? WHERE id = ?");
                $stmt->execute([$request['credits'], $request['user_id']]);
                
                // Also add a transaction record in wallet_transactions if wallet/transaction system is active
                // For simplicity, we just update user credits in marketplace_users right now.
            }

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => "Request $new_status successfully."]);

        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Failed to process request: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
