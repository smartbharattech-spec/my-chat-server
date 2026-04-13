<?php
require_once 'api/config.php';
$stmt = $pdo->prepare("SELECT id, email, project_name, plan_name, plan_id, project_data FROM projects WHERE id = 7");
$stmt->execute();
print_r($stmt->fetch());
?>