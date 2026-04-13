<?php
/**
 * Wallet Helper for Marketplace Commissions
 */

if (!function_exists('processOrderCommission')) {
    /**
     * Processes the commission/payment for an order when it is marked as paid.
     * 
     * @param PDO $pdo The database connection
     * @param int $order_id The ID of the order to process
     * @return bool Success or failure
     */
    function processOrderCommission($pdo, $order_id) {
        try {
            // 1. Fetch order details
            $stmt = $pdo->prepare("SELECT * FROM marketplace_orders WHERE id = ?");
            $stmt->execute([$order_id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$order) {
                error_log("Commission Error: Order #$order_id not found.");
                return false;
            }

            // Only process if payment_status is completed
            if ($order['payment_status'] !== 'completed') {
                error_log("Commission Error: Order #$order_id is not yet paid.");
                return false;
            }

            $product_id = $order['product_id'];
            $buyer_id = $order['user_id'];
            $owner_id = $order['expert_id']; // Local owner (The expert who sold it, potentially an importer)
            $amount = $order['amount'];

            // 1.1 Fetch original creator (Product Owner)
            $stmt = $pdo->prepare("SELECT expert_id FROM marketplace_products WHERE id = ?");
            $stmt->execute([$product_id]);
            $product_info = $stmt->fetch(PDO::FETCH_ASSOC);
            $creator_id = $product_info ? $product_info['expert_id'] : null;

            // 2. Check if already processed for this order
            $stmt = $pdo->prepare("SELECT id FROM wallet_transactions WHERE order_id = ? AND type = 'credit'");
            $stmt->execute([$order_id]);
            if ($stmt->fetch()) {
                // Already processed, don't double credit
                return true;
            }

            // 3. Look for a recommendation in the Occult Tracker
            // We find guidance for this product given to this specific buyer
            $stmt = $pdo->prepare("
                SELECT t.expert_id as recommender_id, u.name as recommender_name
                FROM occult_tracker_guidance g
                JOIN occult_tracker t ON g.tracker_id = t.id
                LEFT JOIN marketplace_users u ON t.expert_id = u.id
                WHERE g.product_id = ? AND t.user_id = ?
                ORDER BY g.created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$product_id, $buyer_id]);
            $recommendation = $stmt->fetch(PDO::FETCH_ASSOC);

            $recommender_id = $recommendation ? $recommendation['recommender_id'] : null;
            $recommender_name = $recommendation ? $recommendation['recommender_name'] : 'Admin';

            // 4. Calculate Split
            $recommender_amount = 0;
            $creator_amount = 0;
            $owner_amount = $amount; // Remaining amount for the Seller (Expert A)

            // A. Split for Recommender
            if ($recommender_id && $recommender_id != $owner_id) {
                // Fetch recommender commission setting
                $stmt = $pdo->prepare("SELECT charge_type, charge_value FROM expert_billing_settings WHERE activity_type = 'recommender_commission'");
                $stmt->execute();
                $rec_setting = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($rec_setting) {
                    if ($rec_setting['charge_type'] === 'percentage') {
                        $recommender_amount = ($amount * $rec_setting['charge_value']) / 100;
                    } else {
                        $recommender_amount = (float)$rec_setting['charge_value'];
                    }
                    $owner_amount -= $recommender_amount;
                }
            }

            // B. Split for Original Creator
            if ($creator_id && $creator_id != $owner_id) {
                // Fetch creator commission setting
                $stmt = $pdo->prepare("SELECT charge_type, charge_value FROM expert_billing_settings WHERE activity_type = 'creator_commission'");
                $stmt->execute();
                $creator_setting = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($creator_setting) {
                    if ($creator_setting['charge_type'] === 'percentage') {
                        $creator_amount = ($amount * $creator_setting['charge_value']) / 100;
                    } else {
                        $creator_amount = (float)$creator_setting['charge_value'];
                    }
                    $owner_amount -= $creator_amount;
                }
            }

            // Ensure owner_amount doesn't go below zero
            if ($owner_amount < 0) $owner_amount = 0;

            // 5. Credit Wallets
            
            // A. Credit the Local Owner (Seller - Expert A)
            $stmt = $pdo->prepare("INSERT IGNORE INTO expert_wallets (expert_id) VALUES (?)");
            $stmt->execute([$owner_id]);
            $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE expert_id = ?");
            $stmt->execute([$owner_amount, $owner_amount, $owner_id]);

            $stmt = $pdo->prepare("SELECT id FROM expert_wallets WHERE expert_id = ?");
            $stmt->execute([$owner_id]);
            $owner_wallet = $stmt->fetch(PDO::FETCH_ASSOC);

            $owner_desc = "Earnings from order #$order_id";
            if ($creator_id && $creator_id != $owner_id) {
                $owner_desc .= " (Imported Product)";
            }
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, order_id, description) VALUES (?, ?, 'credit', ?, ?)");
            $stmt->execute([$owner_wallet['id'], $owner_amount, $order_id, $owner_desc]);

            // B. Credit the Recommender (if applicable)
            if ($recommender_amount > 0) {
                $stmt = $pdo->prepare("INSERT IGNORE INTO expert_wallets (expert_id) VALUES (?)");
                $stmt->execute([$recommender_id]);
                $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE expert_id = ?");
                $stmt->execute([$recommender_amount, $recommender_amount, $recommender_id]);

                $stmt = $pdo->prepare("SELECT id FROM expert_wallets WHERE expert_id = ?");
                $stmt->execute([$recommender_id]);
                $rec_wallet = $stmt->fetch(PDO::FETCH_ASSOC);

                $rec_desc = "Recommendation commission for order #$order_id";
                $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, order_id, description) VALUES (?, ?, 'credit', ?, ?)");
                $stmt->execute([$rec_wallet['id'], $recommender_amount, $order_id, $rec_desc]);

                // Notification for Recommender
                $rec_notif = "You earned ₹$recommender_amount commission for recommending a product (Order #$order_id).";
                $stmt = $pdo->prepare("INSERT INTO marketplace_notifications (user_id, message) VALUES (?, ?)");
                $stmt->execute([$recommender_id, $rec_notif]);
            }

            // C. Credit the Creator (if different from Seller)
            if ($creator_amount > 0 && $creator_id != $owner_id) {
                $stmt = $pdo->prepare("INSERT IGNORE INTO expert_wallets (expert_id) VALUES (?)");
                $stmt->execute([$creator_id]);
                $stmt = $pdo->prepare("UPDATE expert_wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE expert_id = ?");
                $stmt->execute([$creator_amount, $creator_amount, $creator_id]);

                $stmt = $pdo->prepare("SELECT id FROM expert_wallets WHERE expert_id = ?");
                $stmt->execute([$creator_id]);
                $creator_wallet = $stmt->fetch(PDO::FETCH_ASSOC);

                $creator_desc = "Creator royalty for your product sold by others (Order #$order_id)";
                $stmt = $pdo->prepare("INSERT INTO wallet_transactions (wallet_id, amount, type, order_id, description) VALUES (?, ?, 'credit', ?, ?)");
                $stmt->execute([$creator_wallet['id'], $creator_amount, $order_id, $creator_desc]);

                // Notification for Creator
                $creator_notif = "One of your products was sold in another expert's store. You earned ₹$creator_amount royalty (Order #$order_id).";
                $stmt = $pdo->prepare("INSERT INTO marketplace_notifications (user_id, message) VALUES (?, ?)");
                $stmt->execute([$creator_id, $creator_notif]);
            }

            // 6. Notification for Seller
            $notif_message = "You earned ₹$owner_amount from order #$order_id.";
            $stmt = $pdo->prepare("INSERT INTO marketplace_notifications (user_id, message) VALUES (?, ?)");
            $stmt->execute([$owner_id, $notif_message]);

            // 7. Generate Admin Bill for the Seller
            require_once __DIR__ . '/billing_helper.php';
            calculateAndGenerateBill($pdo, $owner_id, $amount, 'product_sale', $order_id);

            return true;
        } catch (Exception $e) {
            error_log("Commission Exception: " . $e->getMessage());
            return false;
        }
    }
}
?>
