<?php
require_once 'api/config.php';

try {
    // 1. Add new columns to tracker_submissions
    $sql = "ALTER TABLE tracker_submissions 
            ADD COLUMN IF NOT EXISTS remedy_id VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS user_image VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS expert_image VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'manual',
            ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT NULL";
    
    $pdo->exec($sql);
    echo "Table 'tracker_submissions' updated successfully.\n";

    // 2. Create uploads directory for tracker images
    $upload_dir = __DIR__ . '/api/uploads/tracker';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
        echo "Directory 'api/uploads/tracker' created.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
