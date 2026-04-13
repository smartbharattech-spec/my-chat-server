<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

try {
    $stmt = $pdo->query("SELECT id, name, email, role, status FROM marketplace_users WHERE role = 'admin'");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($admins, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
