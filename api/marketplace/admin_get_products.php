<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config.php';

try {
    // Fetch all products with expert names
    $stmt = $pdo->prepare("
        SELECT p.*, u.name as expert_name, u.email as expert_email 
        FROM marketplace_products p 
        LEFT JOIN marketplace_users u ON p.expert_id = u.id 
        ORDER BY p.created_at DESC
    ");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'products' => $products
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
