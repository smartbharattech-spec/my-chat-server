<?php
require_once 'api/config.php';
$search = 'iamuser';
$tables = ['users', 'marketplace_users'];
foreach ($tables as $t) {
    echo "--- Search in $t ---\n";
    $stmt = $pdo->query("SELECT * FROM $t");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        foreach ($row as $col => $val) {
            if (stripos((string)$val, $search) !== false) {
                echo "MATCH in $t | Column $col: $val\n";
                print_r($row);
            }
        }
    }
}
?>
