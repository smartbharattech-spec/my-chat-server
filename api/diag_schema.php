<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';
try {
    $stmt = $pdo->query('DESCRIBE projects');
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo $e->getMessage();
}
?>