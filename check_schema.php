<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("DESCRIBE marketplace_orders");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    $stmt = $pdo->query("DESCRIBE course_purchases");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
