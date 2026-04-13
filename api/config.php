<?php
// URL & Environment Configuration
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$is_local = (strpos($host, 'localhost') !== false || $host === '127.0.0.1' || strpos($host, '192.168.') !== false);

if ($is_local) {
    // LOCAL CONFIGURATION
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'myvastutool');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    
    define('APP_URL', "http://localhost:5173");
    define('API_URL', "$protocol://$host/myvastutool/api");
} else {
    // LIVE CONFIGURATION
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u737940041_tool');
    define('DB_USER', 'u737940041_tool');
    define('DB_PASS', 'Yc*2wI0*xSk');
    
    define('APP_URL', "https://myvastutool.com");
    define('API_URL', "https://myvastutool.com/api");
}

// DigiLocker (API Setu) Configuration
// Register at: https://apisetu.gov.in/
define('DIGILOCKER_CLIENT_ID', 'YOUR_CLIENT_ID_HERE'); 
define('DIGILOCKER_CLIENT_SECRET', 'YOUR_CLIENT_SECRET_HERE');
define('DIGILOCKER_REDIRECT_URI', API_URL . '/marketplace/digilocker_callback.php');
define('DIGILOCKER_AUTH_URL', "https://digilocker.merit.gov.in/public/oauth2/1/authorize");
define('DIGILOCKER_TOKEN_URL', "https://digilocker.merit.gov.in/public/oauth2/1/token");
define('DIGILOCKER_AADHAAR_URL', "https://digilocker.merit.gov.in/public/oauth2/1/xml/eaadhaar");

// Global CORS Handling
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if (!defined('NO_JSON_HEADER')) {
    header("Content-Type: application/json");
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die(json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $e->getMessage()
    ]));
}
