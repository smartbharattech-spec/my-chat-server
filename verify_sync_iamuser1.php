<?php
require_once 'api/config.php';
$email = 'iamuser1@gmail.com';

echo "FETCHING TRACKER FOR: $email\n";

// Emulate calling the API
$_GET['email'] = $email;
ob_start();
include 'api/tracker.php';
$output = ob_get_clean();

$data = json_decode($output, true);
if ($data['status'] === 'success') {
    echo "SUCCESS: Found " . count($data['data']) . " submissions.\n";
    foreach ($data['data'] as $sub) {
        echo " - ID: " . $sub['id'] . " | Project: " . $sub['p_name'] . " | Problem: " . $sub['problem'] . " | Zone: " . $sub['zone'] . "\n";
    }
} else {
    echo "ERROR: " . $data['message'] . "\n";
}
?>
