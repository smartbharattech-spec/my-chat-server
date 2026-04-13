<?php
require_once '../config.php';

// Generate a random state for security
$state = bin2hex(random_bytes(16));
session_start();
$_SESSION['digilocker_state'] = $state;

// Build the DigiLocker Authorization URL
$query = http_build_query([
    'response_type' => 'code',
    'client_id'     => DIGILOCKER_CLIENT_ID,
    'redirect_uri'  => DIGILOCKER_REDIRECT_URI,
    'state'         => $state
]);

$authUrl = DIGILOCKER_AUTH_URL . "?" . $query;

// Store user_id for callback mapping
$_SESSION['expert_user_id_verifying'] = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if (DIGILOCKER_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
    echo json_encode(['status' => 'error', 'message' => 'DigiLocker Client ID is not configured in config.php']);
} else {
    echo json_encode([
        'status'   => 'success',
        'auth_url' => $authUrl
    ]);
}
?>
