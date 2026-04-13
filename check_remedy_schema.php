<?php
require_once 'api/config.php';
$table = 'entrance_remedies';
try {
    echo "\nTable: $table\n";
    $stmt = $pdo->query("DESCRIBE $table");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo " - " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo " Error describing $table: " . $e->getMessage() . "\n";
}
?>
