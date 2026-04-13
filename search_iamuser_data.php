<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT id, project_name, email, follower_id, project_data FROM projects");
while ($r = $stmt->fetch()) {
    if (stripos($r['project_data'], 'iamuser') !== false) {
        echo "FOUND iamuser in data of ID: " . $r['id'] . " Name: " . $r['project_name'] . "\n";
    }
}
?>
