<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('SHOW TABLES');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
