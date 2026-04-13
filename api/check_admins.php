<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("SELECT id, username, email, role FROM admins");
    $admins = $stmt->fetchAll();
    echo json_encode($admins, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo $e->getMessage();
}
?>