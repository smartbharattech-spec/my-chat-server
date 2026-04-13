<?php
require_once __DIR__ . '/../config.php';

try {
    // 1. Update ENUM for activity_type in expert_billing_settings
    $pdo->exec("ALTER TABLE expert_billing_settings MODIFY COLUMN activity_type ENUM('product_sale', 'chat_message', 'community_join', 'creator_commission', 'recommender_commission') NOT NULL");
    
    // 2. Update ENUM for activity_type in expert_bills
    $pdo->exec("ALTER TABLE expert_bills MODIFY COLUMN activity_type ENUM('product_sale', 'chat_message', 'community_join', 'creator_commission', 'recommender_commission') NOT NULL");

    // 3. Add the commissions settings
    $pdo->exec("INSERT IGNORE INTO expert_billing_settings (activity_type, charge_type, charge_value) VALUES 
                ('creator_commission', 'percentage', 10.00),
                ('recommender_commission', 'percentage', 5.00)");

    echo json_encode(["status" => "success", "message" => "Updated billing settings ENUM and added commission entries."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
