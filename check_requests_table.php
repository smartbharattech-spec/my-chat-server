<?php
require_once '../config.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'marketplace_credit_requests'");
    $exists = $stmt->fetch() ? true : false;
    echo json_encode(['table_exists' => $exists]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
