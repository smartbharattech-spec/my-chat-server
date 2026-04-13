<?php
require_once 'config.php';
echo "--- expert_profiles ---\n";
foreach ($pdo->query("DESCRIBE expert_profiles")->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
echo "\n--- marketplace_products ---\n";
foreach ($pdo->query("DESCRIBE marketplace_products")->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
?>
