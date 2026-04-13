<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';
try {
    $stmt = $pdo->prepare("INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES ('billing_grace_period', '2')");
    $stmt->execute();
    echo "Grace period setting initialized successfully.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
