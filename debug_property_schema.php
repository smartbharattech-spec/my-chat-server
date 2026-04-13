<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("DESCRIBE user_property_details");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
