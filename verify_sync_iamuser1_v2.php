<?php
require_once 'api/config.php';
$email = 'iamuser1@gmail.com';

echo "FETCHING TRACKER FOR: $email\n";

$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['email'] = $email;

// Since tracker.php might exit or echo, just define the logic here or run it carefully
try {
    include 'api/tracker.php';
} catch (Exception $e) {
    echo "CAUGHT: " . $e->getMessage();
}
?>
