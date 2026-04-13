<?php
include_once 'config.php';

// Use global $pdo from config.php
global $pdo;
$db = $pdo;

$query = "CREATE TABLE IF NOT EXISTS settings (
id INT(11) NOT NULL AUTO_INCREMENT,
setting_key VARCHAR(255) NOT NULL UNIQUE,
setting_value TEXT NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id)
)";

$stmt = $db->prepare($query);

if ($stmt->execute()) {
    // Insert default WhatsApp number if not exists
    $checkQuery = "SELECT id FROM settings WHERE setting_key = 'whatsapp_number'";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute();

    if ($checkStmt->rowCount() == 0) {
        $insertQuery = "INSERT INTO settings (setting_key, setting_value) VALUES ('whatsapp_number', '919999999999')";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->execute();
        echo json_encode(array("message" => "Settings table created and default WhatsApp number inserted."));
    } else {
        echo json_encode(array("message" => "Settings table exists. Default value already present."));
    }
} else {
    echo json_encode(array("message" => "Unable to create settings table."));
}
?>