<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

try {
    $stmt = $pdo->query("ALTER TABLE projects ADD COLUMN property_type VARCHAR(57) NOT NULL DEFAULT 'Residential' AFTER construction_type");
    echo "Column 'property_type' added successfully.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>