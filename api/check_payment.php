<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

// Database connection (assuming config.php now provides a $pdo object)
require_once 'config.php';

// Check if PDO connection was successful (e.g., by catching PDOException in config.php or here)
// For simplicity, we'll assume $pdo is available and connected, and errors are caught below.

// Read POST data
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (!$email) {
    echo json_encode(['status' => false, 'message' => 'Email required']);
    exit;
}

// Prepare SQL
try {
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE email = :email AND status = 'Active' ORDER BY created_at DESC LIMIT 1");
    $stmt->execute(['email' => $email]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode(['status' => true, 'message' => 'Payment active']);
    } else {
        echo json_encode(['status' => false, 'message' => 'Payment not active']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'SQL error: ' . $e->getMessage()]);
}
?>
