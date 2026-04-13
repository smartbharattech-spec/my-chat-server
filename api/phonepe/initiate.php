<?php
// api/phonepe/initiate.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include configuration
require_once __DIR__ . '/config.php';

// Handle JSON input
$input = json_decode(file_get_contents("php://input"), true);

// Receive dynamic parameters
$amount = $input['amount'] ?? $_POST['amount'] ?? null;
$base_order_id = $input['order_id'] ?? $_POST['order_id'] ?? 'ORD' . time();

// Generate a UNIQUE transaction ID for this attempt (PhonePe needs unique IDs)
$order_id = substr($base_order_id, 0, 20) . '_' . time();
$return_url = $input['return_url'] ?? $_POST['return_url'] ?? '';

if (!$order_id || !$amount) {
    die(json_encode(['status' => 'error', 'message' => 'Missing order_id or amount.']));
}

$amount_clean = str_replace(',', '', $amount);
$amount_number = floatval($amount_clean);
$amount_Paise = (int) round($amount_number * 100);

// === Step 1: Generate OAuth Token ===
$postFields = http_build_query([
    "client_version" => defined('PHONEPE_CLIENT_VERSION') ? PHONEPE_CLIENT_VERSION : 1,
    "grant_type" => "client_credentials",
    "client_id" => PHONEPE_CLIENT_ID,
    "client_secret" => PHONEPE_CLIENT_SECRET
]);

$ch = curl_init(PHONEPE_OAUTH_URL);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/x-www-form-urlencoded", "accept: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);

$oauthResponse = curl_exec($ch);
$oauthHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$tokenData = json_decode($oauthResponse, true);

if (!isset($tokenData['access_token'])) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Failed to get OAuth token',
        'debug' => $tokenData
    ]));
}

$accessToken = $tokenData['access_token'];

// === Step 2: Create Payment Request (Adding merchantId as fallback) ===
$paymentData = [
    "merchantId" => PHONEPE_CLIENT_ID, // Added as fallback for some v2 versions
    "merchantOrderId" => $order_id,
    "amount" => $amount_Paise,
    "expireAfter" => 1200,
    "metaInfo" => [
        "udf1" => "VastuTool",
        "udf2" => "Order_" . $base_order_id,
        "udf3" => "Amount_" . $amount,
        "udf4" => "Web",
        "udf5" => "Live"
    ],
    "paymentFlow" => [
        "type" => "PG_CHECKOUT",
        "message" => "Vastu Tool Payment " . $base_order_id,
        "merchantUrls" => [
            "redirectUrl" => PHONEPE_CALLBACK_URL . "?order_id=" . urlencode($base_order_id) . ($return_url ? "&return_url=" . urlencode($return_url) : ""),
            "callbackUrl" => PHONEPE_CALLBACK_URL
        ]
    ]
];

// === Step 3: Call Payment API ===
$ch = curl_init(PHONEPE_INIT_URL);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: O-Bearer ' . $accessToken,
    'accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));

$paymentResponse = curl_exec($ch);
$paymentHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$paymentResult = json_decode($paymentResponse, true);

// Logging Payment Step
$paymentLog = [
    'time' => date('Y-m-d H:i:s'),
    'url' => PHONEPE_INIT_URL,
    'httpCode' => $paymentHttpCode,
    'response' => $paymentResult,
    'payload' => $paymentData
];
file_put_contents('initiate_log.txt', json_encode($paymentLog, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);

if ($paymentHttpCode === 200 && isset($paymentResult['redirectUrl'])) {
    echo json_encode([
        'status' => 'success',
        'redirectUrl' => $paymentResult['redirectUrl'],
        'order_id' => $base_order_id
    ]);
} else {
    $errorMsg = $paymentResult['message'] ?? 'Failed to generate payment URL';
    $errorCode = $paymentResult['code'] ?? $paymentHttpCode;
    echo json_encode([
        'status' => 'error',
        'message' => "PhonePe Error ($errorCode): $errorMsg",
        'debug' => $paymentResult
    ]);
}
?>