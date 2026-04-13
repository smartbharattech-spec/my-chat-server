<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/billing_helper.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';
$admin_id = isset($data['admin_id']) ? (int)$data['admin_id'] : 0;

if (!$admin_id) {
    echo json_encode(['status' => 'error', 'message' => 'Admin ID is required.']);
    exit;
}

try {
    if ($action === 'get_expert_billing_summary') {
        // Fetch all experts with their bill counts and totals
        $stmt = $pdo->query("
            SELECT 
                u.id, u.name, u.email, u.is_blocked, u.block_reason,
                COUNT(b.id) as total_bills,
                SUM(CASE WHEN b.status = 'pending' THEN b.amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END) as paid_amount,
                COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_count
            FROM marketplace_users u
            LEFT JOIN expert_bills b ON u.id = b.expert_id
            WHERE u.role = 'expert'
            GROUP BY u.id
            ORDER BY pending_amount DESC, u.name ASC
        ");
        $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $summary]);

    } elseif ($action === 'get_expert_details') {
        $expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
        if (!$expert_id) throw new Exception("Expert ID required.");

        $stmt = $pdo->prepare("SELECT * FROM expert_bills WHERE expert_id = ? ORDER BY created_at DESC");
        $stmt->execute([$expert_id]);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT name, is_blocked, block_reason FROM marketplace_users WHERE id = ?");
        $stmt->execute([$expert_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'bills' => $bills, 'user' => $user]);

    } elseif ($action === 'mark_bill_paid') {
        $bill_id = isset($data['bill_id']) ? (int)$data['bill_id'] : 0;
        if (!$bill_id) throw new Exception("Bill ID required.");

        $stmt = $pdo->prepare("UPDATE expert_bills SET status = 'paid' WHERE id = ?");
        $stmt->execute([$bill_id]);

        // Trigger block check
        $stmt = $pdo->prepare("SELECT expert_id FROM expert_bills WHERE id = ?");
        $stmt->execute([$bill_id]);
        $expert_id = $stmt->fetchColumn();
        if ($expert_id) checkAndBlockExpert($pdo, $expert_id);

        echo json_encode(['status' => 'success', 'message' => 'Bill marked as paid manually.']);

    } elseif ($action === 'toggle_block') {
        $expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
        $is_blocked = isset($data['is_blocked']) ? (int)$data['is_blocked'] : 0;
        $reason = isset($data['reason']) ? $data['reason'] : 'Blocked by Administrator.';

        if (!$expert_id) throw new Exception("Expert ID required.");

        $stmt = $pdo->prepare("UPDATE marketplace_users SET is_blocked = ?, block_reason = ? WHERE id = ?");
        $stmt->execute([$is_blocked, $is_blocked ? $reason : null, $expert_id]);

        echo json_encode(['status' => 'success', 'message' => 'Expert block status updated.']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
