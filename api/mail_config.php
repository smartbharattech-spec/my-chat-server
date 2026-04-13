<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Require Composer's autoloader
// Adjust path if vendor is in a different location relative to this file
require '../vendor/autoload.php';

function sendMail($to, $subject, $body)
{
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.hostinger.com';                     // Set the SMTP server to send through
        $mail->SMTPAuth = true;                                   // Enable SMTP authentication
        $mail->Username = 'onboarding@myvastutool.com';               // SMTP username
        $mail->Password = 'e[1TsJR]zq';                  // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         // Enable TLS encryption
        $mail->Port = 587;                                    // TCP port to connect to; use 587 for TLS, 465 for SSL
        $mail->Timeout = 15;                                     // Timeout in seconds
        $mail->Timelimit = 15;                                     // Time limit in seconds

        // Recipients
        $mail->setFrom('onboarding@myvastutool.com', 'MyVastuTool');
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = strip_tags($body);

        $mail->send();
        return ['status' => true, 'message' => 'Email has been sent'];
    } catch (Exception $e) {
        // Log detailed error for admin but return generic error to user
        // error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return ['status' => false, 'message' => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"];
    }
}
?>