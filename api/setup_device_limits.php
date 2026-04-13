<?php
include_once 'config.php';

global $pdo;

try {
    // 1. Create user_devices table
    $sqlDevices = "CREATE TABLE IF NOT EXISTS user_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        user_agent VARCHAR(255),
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (device_id)
    )";
    $pdo->exec($sqlDevices);
    echo "Table 'user_devices' checked/created.\n";

    // 2. Add device_limit to plans table
    $stmt = $pdo->query("SHOW COLUMNS FROM plans LIKE 'device_limit'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE plans ADD COLUMN device_limit INT DEFAULT 1 AFTER price");
        echo "Column 'device_limit' added to 'plans' table.\n";
    } else {
        echo "Column 'device_limit' already exists in 'plans' table.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>