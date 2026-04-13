<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM payments");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>