<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('DESCRIBE expert_profiles');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
