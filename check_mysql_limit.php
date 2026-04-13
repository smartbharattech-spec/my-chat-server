<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    print_r($stmt->fetch());
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>