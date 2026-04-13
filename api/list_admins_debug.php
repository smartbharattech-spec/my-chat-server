<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';
try {
    $stmt = $pdo->query('SELECT id, username, email FROM admins');
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo $e->getMessage();
}
?>