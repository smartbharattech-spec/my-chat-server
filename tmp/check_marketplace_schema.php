<?php
require 'api/config.php';
try {
    $stmt = $pdo->query("DESCRIBE marketplace_users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
?>
