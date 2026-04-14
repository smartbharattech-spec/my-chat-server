<?php
$pdo = new PDO('mysql:host=localhost;dbname=myvastutool', 'root', '');
$_GET = ['email' => 'smartbharattech@gmail.com', 'folder_id' => 'root'];
ob_start();
include 'api/projects.php';
$output = ob_get_clean();
echo $output;
?>
