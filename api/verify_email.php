<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = isset($_GET['token']) ? trim($_GET['token']) : '';

    if (empty($token)) {
        // Redirect to login with error
        header("Location: " . APP_URL . "/#/login?error=missing_token");
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE verification_token = ? AND is_verified = 0");
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Mark as verified and clear token
            $updateStmt = $pdo->prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            // Redirect to login with success
            header("Location: " . APP_URL . "/#/login?verified=true");
            exit;
        } else {
            // Redirect with invalid token error (could be already verified)
            header("Location: " . APP_URL . "/#/login?error=invalid_token");
            exit;
        }
    } catch (PDOException $e) {
        // Log error and redirect
        // error_log($e->getMessage());
        header("Location: " . APP_URL . "/#/login?error=server_error");
        exit;
    }
}
?>