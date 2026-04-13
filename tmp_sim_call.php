<?php
require 'api/config.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['email'] = 'iamexpert@gmail.com';
$_GET['page'] = '1';
$_GET['limit'] = '10';
$_GET['search'] = '';
$_GET['status'] = 'all';
$_GET['construction_type'] = 'all';
$_GET['folder_id'] = 'root';
require 'api/projects.php';
?>
