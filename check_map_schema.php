<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM map_requests");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>