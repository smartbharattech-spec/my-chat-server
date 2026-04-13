<?php
require_once __DIR__ . '/../config.php';

try {
    $stmt = $pdo->prepare("INSERT IGNORE INTO expert_billing_settings (activity_type, charge_type, charge_value, description) 
                          VALUES ('creator_commission', 'percentage', 10.00, 'Commission for original product creator when sold by others')");
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Added creator_commission setting."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
