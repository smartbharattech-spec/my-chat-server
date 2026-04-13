<?php
require_once 'c:/xampp/htdocs/myvastutool/api/config.php';

function desc($table, $pdo) {
    try {
        echo "\nTable: $table\n";
        $stmt = $pdo->query("DESCRIBE $table");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo " - " . $row['Field'] . " (" . $row['Type'] . ")\n";
        }
    } catch (Exception $e) {
        echo " Error describing $table: " . $e->getMessage() . "\n";
    }
}

desc('marketplace_products', $pdo);
desc('expert_profiles', $pdo);
desc('marketplace_users', $pdo);
desc('occult_experts', $pdo);
?>
