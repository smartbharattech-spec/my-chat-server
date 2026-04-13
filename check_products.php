<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('SELECT id, expert_id, name, status FROM marketplace_products');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
