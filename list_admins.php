<?php
require 'api/config.php';

try {
    $stmt = $pdo->query("SELECT id, username, email, role FROM admins");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($admins)) {
        echo "No admins found.\n";
    } else {
        echo "Admins found:\n";
        foreach ($admins as $admin) {
            echo "ID: " . $admin['id'] . ", Username: " . $admin['username'] . ", Email: " . $admin['email'] . ", Role: " . ($admin['role'] ?? 'N/A') . "\n";
        }
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
