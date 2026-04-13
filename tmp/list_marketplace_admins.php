<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("SELECT id, name, email, role FROM marketplace_users WHERE role = 'admin'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: " . $row['id'] . ", Name: " . $row['name'] . ", Email: " . $row['email'] . ", Role: " . $row['role'] . "\n";
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
