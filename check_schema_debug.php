<?php
require_once 'api/config.php';

try {
    $stmt = $pdo->query("DESCRIBE users");
    echo "Users Table:\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    $stmt = $pdo->query("DESCRIBE password_resets");
    echo "\nPassword Resets Table:\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
