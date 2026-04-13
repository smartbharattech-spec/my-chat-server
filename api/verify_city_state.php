<?php
require_once 'api/config.php';

$testEmail = "test_city_state_" . time() . "@example.com";
$testData = [
    "firstname" => "Test User",
    "email" => $testEmail,
    "password" => "Password@123",
    "mobile" => "1234567890",
    "whatsapp" => "1234567890",
    "city" => "Test City",
    "state" => "Test State",
    "is_consultant" => "0"
];

$ch = curl_init("http://localhost/myvastutool/api/createaccount.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

echo "Registration Response: " . $response . "\n";

$stmt = $pdo->prepare("SELECT city, state FROM users WHERE email = ?");
$stmt->execute([$testEmail]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && $user['city'] === 'Test City' && $user['state'] === 'Test State') {
    echo "Verification SUCCESS: City and State saved correctly.\n";
} else {
    echo "Verification FAILED: City and State not found or incorrect.\n";
    print_r($user);
}

// Cleanup
$pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$testEmail]);
?>
