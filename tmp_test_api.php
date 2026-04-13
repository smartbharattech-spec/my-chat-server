<?php
require 'api/config.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['email'] = 'iamexpert@gmail.com';
require 'api/projects.php';
?>
