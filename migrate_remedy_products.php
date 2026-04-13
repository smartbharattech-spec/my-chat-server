<?php
require_once 'api/config.php';

try {
    // Check if product_id exists and product_ids doesn't
    $stmt = $pdo->query("DESCRIBE entrance_remedies");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('product_id', $columns) && !in_array('product_ids', $columns)) {
        // Change product_id to product_ids and change type to TEXT
        $pdo->exec("ALTER TABLE entrance_remedies CHANGE product_id product_ids TEXT NULL DEFAULT NULL");
        echo "Successfully migrated product_id to product_ids (TEXT) in entrance_remedies table.\n";
    } else {
        echo "Migration not needed or already completed.\n";
    }
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
