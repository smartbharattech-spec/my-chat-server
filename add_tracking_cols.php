<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN tracking_link VARCHAR(500) DEFAULT NULL");
    $pdo->exec("ALTER TABLE marketplace_orders ADD COLUMN tracking_id VARCHAR(255) DEFAULT NULL");
    echo "Columns added";
} catch (Exception $e) {
    echo $e->getMessage();
}
