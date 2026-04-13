<?php
// PhonePe Configuration
define('PHONEPE_ENV', 'production');

if (PHONEPE_ENV === 'production') {
    // === Production Settings ===
    define('PHONEPE_CLIENT_ID', 'SU2601231708290817219891');
    define('PHONEPE_CLIENT_SECRET', '7ab61cab-5112-4e12-be73-b024f5bbc82f');
    define('PHONEPE_CLIENT_VERSION', 1);

    // OAuth and Payment URLs
    define('PHONEPE_OAUTH_URL', 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token');
    define('PHONEPE_INIT_URL', 'https://api.phonepe.com/apis/pg/checkout/v2/pay');

    // HARDCODED LIVE DOMAIN to prevent security blocks
    $baseUrl = "https://myvastutool.com";
} else {
    // === Sandbox Settings ===
    define('PHONEPE_CLIENT_ID', 'TEST-M23ZHAIWMAN4N_25092');
    define('PHONEPE_CLIENT_SECRET', 'MDdjMWVjZjctYTg3Yi00NGYyLWE2ZDEtNGQxMzI5MDk3YTQ0');
    define('PHONEPE_CLIENT_VERSION', 1);

    define('PHONEPE_OAUTH_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token');
    define('PHONEPE_INIT_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay');

    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl = "$protocol://$host";
}

// Dynamic folder detection
$currentDir = dirname($_SERVER['PHP_SELF']);
if ($currentDir === '/' || $currentDir === '\\')
    $currentDir = '';

define('PHONEPE_CALLBACK_URL', $baseUrl . $currentDir . '/callback.php');
define('PHONEPE_REDIRECT_URL', $baseUrl . '/#/dashboard');
?>