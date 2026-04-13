<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("DESCRIBE marketplace_orders");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "columns" => $columns]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
