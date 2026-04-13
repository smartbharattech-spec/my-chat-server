<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('DESCRIBE marketplace_users');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
