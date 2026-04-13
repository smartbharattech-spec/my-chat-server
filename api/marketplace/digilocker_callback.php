<?php
require_once '../config.php';
session_start();

$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';

// 1. Verify State for security
if (empty($state) || $state !== ($_SESSION['digilocker_state'] ?? '')) {
    die("Invalid state. Security check failed.");
}

if (empty($code)) {
    die("Authorization code missing.");
}

try {
    // 2. Exchange Code for Access Token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, DIGILOCKER_TOKEN_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'code'          => $code,
        'grant_type'    => 'authorization_code',
        'client_id'     => DIGILOCKER_CLIENT_ID,
        'client_secret' => DIGILOCKER_CLIENT_SECRET,
        'redirect_uri'  => DIGILOCKER_REDIRECT_URI
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $tokenData = json_decode($response, true);
    if (!isset($tokenData['access_token'])) {
        die("Failed to obtain access token from DigiLocker.");
    }

    $accessToken = $tokenData['access_token'];
    $digilockerId = $tokenData['digilockerid'] ?? '';

    // 3. Fetch Aadhaar XML Data
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, DIGILOCKER_AADHAAR_URL);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $accessToken"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $xmlData = curl_exec($ch);
    curl_close($ch);

    // 4. Parse Aadhaar Data
    // Note: Aadhaar data is usually in a signed XML format. 
    // For now, we extract the basic info.
    $xml = simplexml_load_string($xmlData);
    $aadhaarName = (string)$xml->CertificateData->KycRes->UidData->Pht->attributes()->name ?? 'Unknown';

    // 5. Update Database
    // We need to know which user this corresponds to. 
    // Usually, we store the user_id in the session before redirecting.
    $user_id = $_SESSION['expert_user_id_verifying'] ?? 0;

    if ($user_id > 0) {
        $stmt = $pdo->prepare("UPDATE expert_profiles SET is_verified = 1, digilocker_id = ? WHERE user_id = ?");
        $stmt->execute([$digilockerId, $user_id]);
        
        // Redirect back to dashboard with success
        header("Location: " . APP_URL . "/#/occult/expert-dashboard?verification=success");
    } else {
        die("User session expired. Verification failed.");
    }

} catch (Exception $e) {
    die("Error during verification: " . $e->getMessage());
}
?>
