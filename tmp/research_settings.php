<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

try {
    $stmt = $pdo->query("SELECT * FROM marketplace_settings");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Settings: " . json_encode($settings, JSON_PRETTY_PRINT) . "\n\n";

    $stmt = $pdo->query("DESCRIBE marketplace_settings");
    $schema = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Schema: " . json_encode($schema, JSON_PRETTY_PRINT) . "\n\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
