<?php
header("Content-Type: application/json");
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM projects");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $pdo->query("SELECT * FROM projects LIMIT 5");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "total_projects" => $total,
        "sample_projects" => $samples
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
