<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/config.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$project_id = $data['project_id'] ?? null;
$plan = $data['plan'] ?? '';
$plan_id = $data['plan_id'] ?? null;
$price = $data['price'] ?? 0;
$credits = $data['credits'] ?? 0;
$purchase_type = $data['purchase_type'] ?? 'new_purchase';

if (!$email || !$price) {
    echo json_encode(["status" => "error", "message" => "Required fields missing"]);
    exit;
}

// 1. Generate Transaction ID
$transactionId = "TXN" . time() . rand(1000, 9999);

// 2. Format Amount (PhonePe expects paise/cents? Usually for INR it's Paise - multiply by 100)
// Check if price is like "₹500" or just "500"
$cleanPrice = preg_replace('/[^0-9.]/', '', $price);
$amountInPaise = (int) ($cleanPrice * 100);

// 3. Save Payment Request in DB with 'Requested' status
try {
    $stmt = $pdo->prepare("INSERT INTO payments (email, project_id, plan, plan_id, price, credits, status, purchase_type, transaction_id) VALUES (:email, :project_id, :plan, :plan_id, :price, :credits, 'Requested', :purchase_type, :transaction_id)");
    $stmt->execute([
        'email' => $email,
        'project_id' => $project_id,
        'plan' => $plan,
        'plan_id' => $plan_id,
        'price' => $price,
        'credits' => $credits,
        'purchase_type' => $purchase_type,
        'transaction_id' => $transactionId
    ]);

    // 4. Construct PhonePe Payload
    $payload = [
        "merchantId" => PHONEPE_MERCHANT_ID,
        "merchantTransactionId" => $transactionId,
        "merchantUserId" => "U" . $email, // Unique User ID
        "amount" => $amountInPaise,
        "redirectUrl" => PHONEPE_CALLBACK_URL . "?transactionId=" . $transactionId,
        "redirectMode" => "POST",
        "callbackUrl" => PHONEPE_CALLBACK_URL . "?transactionId=" . $transactionId,
        "mobileNumber" => "", // Optional
        "paymentInstrument" => [
            "type" => "PAY_PAGE"
        ]
    ];

    $encode = base64_encode(json_encode($payload));
    $saltKey = PHONEPE_SALT_KEY;
    $saltIndex = PHONEPE_SALT_INDEX;

    $string = $encode . "/pg/v1/pay" . $saltKey;
    $sha256 = hash("sha256", $string);
    $finalXHeader = $sha256 . "###" . $saltIndex;

    // 5. Call PhonePe API using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, PHONEPE_INIT_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "X-VERIFY: " . $finalXHeader,
        "accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['request' => $encode]));

    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        echo json_encode(["status" => "error", "message" => "Curl error: " . $err]);
        exit;
    }

    $resData = json_decode($response, true);

    if (isset($resData['success']) && $resData['success'] === true) {
        $payUrl = $resData['data']['instrumentResponse']['redirectInfo']['url'];
        echo json_encode([
            "status" => "success",
            "redirect_url" => $payUrl,
            "transactionId" => $transactionId
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "PhonePe error: " . ($resData['message'] ?? 'Unknown error'),
            "raw_response" => $resData
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>