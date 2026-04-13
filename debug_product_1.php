<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->prepare("SELECT * FROM marketplace_products WHERE id = 1");
    $stmt->execute();
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "PRODUCT: " . json_encode($product) . "\n";
    
    if ($product) {
        $stmtExpert = $pdo->prepare("SELECT * FROM expert_profiles WHERE user_id = ?");
        $stmtExpert->execute([$product['expert_id']]);
        $expert = $stmtExpert->fetch(PDO::FETCH_ASSOC);
        echo "EXPERT: " . json_encode($expert) . "\n";
    }
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
