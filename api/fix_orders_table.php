<?php
require_once 'config.php';
try {
    // Add missing tracking columns
    $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS tracking_link VARCHAR(255) DEFAULT NULL AFTER status");
    $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) DEFAULT NULL AFTER tracking_link");
    
    echo json_encode(["status" => "success", "message" => "Tracking columns added to marketplace_orders"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
