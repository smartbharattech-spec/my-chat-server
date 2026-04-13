<?php
require 'api/config.php';
$count = $pdo->exec("UPDATE marketplace_products SET product_type = 'course' WHERE id IN (1, 7, 22)");
echo "Updated " . $count . " rows.";
?>
