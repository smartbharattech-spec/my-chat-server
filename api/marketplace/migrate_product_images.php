<?php
require_once '../config.php';

try {
    echo "Starting database migration for multiple images...\n";

    // Add images (JSON) to marketplace_products
    $pdo->exec("ALTER TABLE marketplace_products 
                ADD COLUMN IF NOT EXISTS images JSON");
    echo "Added images (JSON) column to marketplace_products.\n";

    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
