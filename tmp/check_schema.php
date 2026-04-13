<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';
try {
    $stmt = $pdo->query("DESC entrance_remedies");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
