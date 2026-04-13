<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM course_purchases");
    echo "Total course purchases: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM marketplace_users");
    echo "Total marketplace users: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $pdo->query("SELECT cp.* FROM course_purchases cp LIMIT 5");
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($purchases);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
