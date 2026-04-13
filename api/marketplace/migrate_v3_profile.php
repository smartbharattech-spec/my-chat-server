<?php
require_once '../config.php';

try {
    // Check if columns exist before adding
    $table = 'expert_profiles';
    
    // Check hourly_rate
    $checkRate = $pdo->query("SHOW COLUMNS FROM $table LIKE 'hourly_rate'");
    if (!$checkRate->fetch()) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00 AFTER rating");
        echo "Column 'hourly_rate' added successfully.\n";
    } else {
        echo "Column 'hourly_rate' already exists.\n";
    }

    // Check languages
    $checkLang = $pdo->query("SHOW COLUMNS FROM $table LIKE 'languages'");
    if (!$checkLang->fetch()) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN languages VARCHAR(255) AFTER hourly_rate");
        echo "Column 'languages' added successfully.\n";
    } else {
        echo "Column 'languages' already exists.\n";
    }

    echo "Migration completed successfully.";
} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage();
}
?>
