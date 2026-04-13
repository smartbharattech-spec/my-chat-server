<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => false, 'message' => 'Invalid email address']);
    exit;
}

try {
    // Check if email exists in admins table
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() === 0) {
        // Detailed message for admin for easier debugging, or generic for security
        echo json_encode(['status' => false, 'message' => 'Admin account not found with this email']);
        exit;
    }

    // Generate numeric OTP
    $otp = rand(100000, 999999);

    // Delete old tokens for this email
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    // Store new OTP
    $stmt = $pdo->prepare("INSERT INTO password_resets (email, token) VALUES (?, ?)");
    $stmt->execute([$email, $otp]);

    // Send OTP via Email
    require_once 'mail_config.php';
    $subject = "Admin Password Reset OTP - MyVastuTool";
    $body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Admin Password Reset</title>
    </head>
    <body style='margin: 0; padding: 0; background-color: #f3f4f6; font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif;'>
        <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 40px; margin-bottom: 40px;'>
            <!-- Header -->
            <tr>
                <td align='center' style='padding: 40px 0; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);'>
                    <h1 style='color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;'>MyVastuTool Admin</h1>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td style='padding: 40px 30px;'>
                    <h2 style='color: #111827; margin-top: 0; margin-bottom: 20px; font-size: 22px; text-align: center;'>Admin Recovery Request</h2>
                    <p style='color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;'>
                        You requested to reset your admin password. Use the verification code below to proceed.
                    </p>
                    
                    <div style='text-align: center; margin-bottom: 40px;'>
                        <span style='display: inline-block; background-color: #eff6ff; color: #1e40af; font-size: 32px; font-weight: 800; padding: 15px 30px; border-radius: 8px; border: 2px dashed #3b82f6; letter-spacing: 5px;'>$otp</span>
                    </div>
                    
                    <p style='color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center; margin-bottom: 0;'>
                        This code will expire in 15 minutes.<br>
                        If you didn't request this, please secure your account immediately.
                    </p>
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td style='background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;'>
                    <p style='color: #9ca3af; font-size: 12px; margin: 0;'>
                        &copy; " . date("Y") . " MyVastuTool Admin Security.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    ";

    $mailResult = sendMail($email, $subject, $body);

    if ($mailResult['status']) {
        echo json_encode([
            'status' => true,
            'message' => 'Verification code sent to your admin email.'
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Could not send email. Please try again later. (' . $mailResult['message'] . ')'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
