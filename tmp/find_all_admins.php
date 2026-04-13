<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(", ", $tables) . "\n\n";

    if (in_array('admins', $tables)) {
        $stmt = $pdo->query("SELECT id, username, email FROM admins");
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Admins Table:\n" . json_encode($admins, JSON_PRETTY_PRINT) . "\n\n";
    }
    
    if (in_array('marketplace_users', $tables)) {
        $stmt = $pdo->query("SELECT id, name, email, role FROM marketplace_users WHERE role = 'admin'");
        $m_admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Marketplace Admins:\n" . json_encode($m_admins, JSON_PRETTY_PRINT) . "\n\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
