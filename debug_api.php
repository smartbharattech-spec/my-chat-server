<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

$pid = 1; // Testing with ID 1
echo "Debugging Product ID: $pid\n";

try {
    // 1. Check if product exists
    $stmt = $pdo->prepare("SELECT * FROM marketplace_products WHERE id = ?");
    $stmt->execute([$pid]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        echo "Error: Product $pid not found in marketplace_products table.\n";
    } else {
        echo "Product Found: " . $product['name'] . " (Status: " . $product['status'] . ", Expert ID: " . $product['expert_id'] . ")\n";
        
        // 2. Check if expert exists
        $stmtEx = $pdo->prepare("SELECT * FROM expert_profiles WHERE user_id = ?");
        $stmtEx->execute([$product['expert_id']]);
        $expert = $stmtEx->fetch(PDO::FETCH_ASSOC);
        
        if (!$expert) {
            echo "Error: Expert ID " . $product['expert_id'] . " not found in expert_profiles table.\n";
            
            // 3. Check if they exist in marketplace_users instead?
            $stmtUser = $pdo->prepare("SELECT * FROM marketplace_users WHERE id = ?");
            $stmtUser->execute([$product['expert_id']]);
            $muser = $stmtUser->fetch(PDO::FETCH_ASSOC);
            if ($muser) {
                echo "Wait: Expert exists in marketplace_users but NOT in expert_profiles.\n";
            }
        } else {
            echo "Expert Found: " . $expert['name'] . " (User ID: " . $expert['user_id'] . ")\n";
        }
    }
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
?>
