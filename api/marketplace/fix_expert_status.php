<?php
header('Content-Type: text/plain');
require_once '../config.php';

try {
    $stmt = $pdo->query("
        UPDATE marketplace_users 
        SET status = 'active' 
        WHERE role = 'expert' AND (status IS NULL OR status = '' OR status = 'approved')
    ");
    $affected = $stmt->rowCount();

    echo "Successfully updated $affected experts to 'active' status.\n";
    echo "Migration finished.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
