<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/billing_helper.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : (isset($_GET['action']) ? $_GET['action'] : '');
$expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : (isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0);

if (!$expert_id) {
    echo json_encode(['status' => 'error', 'message' => 'Expert ID is required.']);
    exit;
}

try {
    if ($action === 'get_block_status') {
        // First run a fresh check to see if we should unblock (if within grace) or block (if deadline passed)
        checkAndBlockExpert($pdo, $expert_id);

        $stmt = $pdo->prepare("SELECT is_blocked, block_reason FROM marketplace_users WHERE id = ?");
        $stmt->execute([$expert_id]);
        $user_status = $stmt->fetch();

        // Calculate grace period info
        $stmt = $pdo->prepare("SELECT MIN(created_at) FROM expert_bills WHERE expert_id = ? AND status = 'pending'");
        $stmt->execute([$expert_id]);
        $oldest_bill = $stmt->fetchColumn();

        $is_warning = false;
        $days_remaining = null;

        if ($oldest_bill) {
            $stmt = $pdo->prepare("SELECT setting_value FROM marketplace_settings WHERE setting_key = 'billing_grace_period'");
            $stmt->execute();
            $grace_days = (int)($stmt->fetchColumn() ?: 2);

            $deadline = strtotime($oldest_bill . " + $grace_days days");
            $now = time();
            $diff = $deadline - $now;
            
            if ($diff > 0) {
                $is_warning = true;
                $days_remaining = round($diff / (24 * 3600), 1);
            }
        }

        echo json_encode([
            'status' => 'success', 
            'is_blocked' => (int)$user_status['is_blocked'],
            'is_warning' => $is_warning,
            'days_remaining' => $days_remaining,
            'block_reason' => $user_status['block_reason']
        ]);
        exit;
    }

    if ($action === 'get_bills') {
        $stmt = $pdo->prepare("SELECT * FROM expert_bills WHERE expert_id = ? ORDER BY created_at DESC");
        $stmt->execute([$expert_id]);
        $bills = $stmt->fetchAll();

        // Also get blocked status
        $stmt = $pdo->prepare("SELECT is_blocked, block_reason FROM marketplace_users WHERE id = ?");
        $stmt->execute([$expert_id]);
        $user_status = $stmt->fetch();

        echo json_encode([
            'status' => 'success', 
            'bills' => $bills,
            'is_blocked' => (bool)$user_status['is_blocked'],
            'block_reason' => $user_status['block_reason']
        ]);

    } elseif ($action === 'pay_bill') {
        $bill_id = isset($data['bill_id']) ? (int)$data['bill_id'] : 0;

        if (!$bill_id) {
            echo json_encode(['status' => 'error', 'message' => 'Bill ID is required.']);
            exit;
        }

        // Logic for "paying" the bill. 
        // In a real system, this would involve a payment gateway.
        // For now, we'll implement it as a simple status update (maybe deducting from expert wallet if requested, 
        // but user says "expert bill pay nhi karta hai to auto block ho jaye ga", so we assume an external or manual payment trigger).
        // Let's assume they can pay via their wallet balance.

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT amount, status FROM expert_bills WHERE id = ? AND expert_id = ?");
        $stmt->execute([$bill_id, $expert_id]);
        $bill = $stmt->fetch();

        if (!$bill || $bill['status'] === 'paid') {
            echo json_encode(['status' => 'error', 'message' => 'Invalid or already paid bill.']);
            $pdo->rollBack();
            exit;
        }

        $amount = (float)$bill['amount'];

        // Check expert wallet
        $stmt = $pdo->prepare("SELECT balance FROM expert_wallets WHERE expert_id = ?");
        $stmt->execute([$expert_id]);
        $wallet_balance = (float)$stmt->fetchColumn();

        if ($wallet_balance < $amount) {
            echo json_encode(['status' => 'error', 'message' => 'Insufficient wallet balance to pay this bill.']);
            $pdo->rollBack();
            exit;
        }

        // Deduct from wallet
        $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE expert_id = ?");
        $stmt->execute([$amount, $amount, $expert_id]);

        // Log transaction
        $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, description) 
                               SELECT id, ?, 'debit', 'Bill payment (ID: $bill_id)' FROM expert_wallets WHERE expert_id = ?");
        $stmt->execute([$amount, $expert_id]);

        // Mark bill as paid
        $stmt = $pdo->prepare("UPDATE expert_bills SET status = 'paid' WHERE id = ?");
        $stmt->execute([$bill_id]);

        // Check if expert can be unblocked
        checkAndBlockExpert($pdo, $expert_id);

        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Bill paid successfully from wallet.']);

    } elseif ($action === 'pay_bills_bulk') {
        $bill_ids = isset($data['bill_ids']) ? $data['bill_ids'] : [];

        if (empty($bill_ids)) {
            echo json_encode(['status' => 'error', 'message' => 'No bill IDs provided.']);
            exit;
        }

        $pdo->beginTransaction();

        $total_amount = 0;
        foreach ($bill_ids as $bill_id) {
            $stmt = $pdo->prepare("SELECT amount, status FROM expert_bills WHERE id = ? AND expert_id = ?");
            $stmt->execute([(int)$bill_id, $expert_id]);
            $bill = $stmt->fetch();

            if (!$bill || $bill['status'] === 'paid') {
                continue; // Skip invalid or already paid
            }
            $total_amount += (float)$bill['amount'];
        }

        if ($total_amount <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'No pending bills found to pay.']);
            $pdo->rollBack();
            exit;
        }

        // Check wallet
        $stmt = $pdo->prepare("SELECT balance FROM expert_wallets WHERE expert_id = ?");
        $stmt->execute([$expert_id]);
        $wallet_balance = (float)$stmt->fetchColumn();

        if ($wallet_balance < $total_amount) {
            echo json_encode(['status' => 'error', 'message' => 'Insufficient wallet balance for bulk payment. Total: ₹' . number_format($total_amount, 2)]);
            $pdo->rollBack();
            exit;
        }

        // Deduct
        $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE expert_id = ?");
        $stmt->execute([$total_amount, $total_amount, $expert_id]);

        // Log transaction
        $desc = "Bulk Bill Payment (" . count($bill_ids) . " items)";
        $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, description) 
                               SELECT id, ?, 'debit', ? FROM expert_wallets WHERE expert_id = ?");
        $stmt->execute([$total_amount, $desc, $expert_id]);

        // Mark all as paid
        $ids_placeholder = implode(',', array_fill(0, count($bill_ids), '?'));
        $stmt = $pdo->prepare("UPDATE expert_bills SET status = 'paid' WHERE id IN ($ids_placeholder) AND expert_id = ?");
        $params = array_merge($bill_ids, [$expert_id]);
        $stmt->execute($params);

        checkAndBlockExpert($pdo, $expert_id);

        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'All selected bills paid successfully from wallet.']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
