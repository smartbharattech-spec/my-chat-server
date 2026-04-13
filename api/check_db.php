<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("DESCRIBE chat_conversations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "COLUMNS IN chat_conversations:\n";
    print_r($columns);

    $stmt = $pdo->query("DESCRIBE chat_messages");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nCOLUMNS IN chat_messages:\n";
    print_r($columns);

    // Check if marketplace_follows exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'marketplace_follows'");
    $exists = $stmt->fetch();
    echo "\nTABLE marketplace_follows EXISTS: " . ($exists ? "YES" : "NO") . "\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}