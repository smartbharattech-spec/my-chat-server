<?php
require_once __DIR__ . '/../config.php';

try {
    $stmt = $pdo->prepare("INSERT IGNORE INTO expert_billing_settings (activity_type, charge_type, charge_value) 
                          VALUES ('creator_commission', 'percentage', 10.00)");
    $stmt->execute();

    echo "Successfully updated setting.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
