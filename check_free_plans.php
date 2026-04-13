<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("SELECT * FROM plans WHERE is_free = '1' OR id = 10001");
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($plans, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
