<?php
require_once 'api/config.php';
$id = 169;
$stmt = $pdo->prepare("SELECT project_data FROM projects WHERE id = ?");
$stmt->execute([$id]);
$data = $stmt->fetchColumn();
echo "DATA for $id: \n";
echo $data;
?>
