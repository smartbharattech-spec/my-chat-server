<?php
require_once 'api/config.php';

try {
    $stmt = $pdo->query("SELECT id, firstname, email FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Count: " . count($users) . "\n";
    print_r($users);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
