<?php
require_once 'api/config.php';
$tables = ['users', 'marketplace_users', 'projects', 'tracker_submissions'];
foreach ($tables as $t) {
    echo "--- Table: $t ---\n";
    $stmt = $pdo->query("DESCRIBE $t");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>
