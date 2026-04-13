<?php
/**
 * Billing Helper for Expert Commissions and Blocking
 */

if (!function_exists('calculateAndGenerateBill')) {
    /**
     * Calculates admin commission and generates a bill for the expert.
     */
    function calculateAndGenerateBill($pdo, $expert_id, $amount, $activity_type, $reference_id) {
        try {
            // Skip billing if the expert is an Admin
            $stmt = $pdo->prepare("SELECT role FROM marketplace_users WHERE id = ?");
            $stmt->execute([$expert_id]);
            $role = $stmt->fetchColumn();
            if ($role === 'admin') return true;

            // 1. Get billing settings for this activity
            $stmt = $pdo->prepare("SELECT charge_type, charge_value FROM expert_billing_settings WHERE activity_type = ?");
            $stmt->execute([$activity_type]);
            $setting = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$setting) {
                error_log("Billing Error: No setting found for activity type '$activity_type'");
                return false;
            }

            $charge_amount = 0;
            if ($setting['charge_type'] === 'percentage') {
                $charge_amount = ($amount * $setting['charge_value']) / 100;
            } else {
                $charge_amount = $setting['charge_value'];
            }

            if ($charge_amount <= 0) return true; // No charge needed

            // 2. Generate the bill
            $stmt = $pdo->prepare("INSERT INTO expert_bills (expert_id, amount, activity_type, reference_id, status) VALUES (?, ?, ?, ?, 'pending')");
            $stmt->execute([$expert_id, $charge_amount, $activity_type, $reference_id]);

            // 3. Immediately check if expert should be blocked (optional: could be done on login instead)
            // For now, we'll let the automatic blocking logic handle it on next access or via a scheduled task.
            // But let's trigger a check.
            checkAndBlockExpert($pdo, $expert_id);

            return true;
        } catch (Exception $e) {
            error_log("Billing Exception: " . $e->getMessage());
            return false;
        }
    }
}

if (!function_exists('checkAndBlockExpert')) {
    /**
     * Checks if an expert has unpaid bills and blocks them if necessary.
     */
    function checkAndBlockExpert($pdo, $expert_id) {
        try {
            // 1. Get Grace Period from settings
            $stmt = $pdo->prepare("SELECT setting_value FROM marketplace_settings WHERE setting_key = 'billing_grace_period'");
            $stmt->execute();
            $grace_days = (int)($stmt->fetchColumn() ?: 2);

            // 2. Find the oldest pending bill
            $stmt = $pdo->prepare("SELECT MIN(created_at) FROM expert_bills WHERE expert_id = ? AND status = 'pending'");
            $stmt->execute([$expert_id]);
            $oldest_bill_date = $stmt->fetchColumn();

            if ($oldest_bill_date) {
                $deadline = strtotime($oldest_bill_date . " + $grace_days days");
                $now = time();

                if ($now > $deadline) {
                    // Hard block only after deadline
                    $stmt = $pdo->prepare("UPDATE marketplace_users SET is_blocked = 1, block_reason = 'Unpaid billing dues past the grace period. Access restricted.' WHERE id = ?");
                    $stmt->execute([$expert_id]);
                } else {
                    // Within grace period - ensure they are NOT hard-blocked
                    $stmt = $pdo->prepare("UPDATE marketplace_users SET is_blocked = 0 WHERE id = ? AND is_blocked = 1 AND block_reason LIKE 'Unpaid billing dues%'");
                    $stmt->execute([$expert_id]);
                }
            } else {
                // No pending bills - Unblock
                $stmt = $pdo->prepare("UPDATE marketplace_users SET is_blocked = 0, block_reason = NULL WHERE id = ? AND is_blocked = 1 AND block_reason LIKE 'Unpaid billing dues%'");
                $stmt->execute([$expert_id]);
            }
            return true;
        } catch (Exception $e) {
            error_log("Blocking Exception: " . $e->getMessage());
            return false;
        }
    }
}
?>
