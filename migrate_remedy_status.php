<?php
require_once 'api/config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM entrance_remedies LIKE 'status'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE entrance_remedies ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
        echo "Column 'status' added successfully to 'entrance_remedies' table.\n";
    } else {
        echo "Column 'status' already exists.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>