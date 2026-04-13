<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("SELECT id, title, plan_type FROM plans");
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($plans, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>