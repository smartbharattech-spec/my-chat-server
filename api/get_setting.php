<?php
include_once 'config.php';

global $pdo;
$db = $pdo;

$key = isset($_GET['key']) ? $_GET['key'] : 'whatsapp_number';

$query = "SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(":key", $key);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(array("status" => "success", "value" => $row['setting_value']));
} else {
    echo json_encode(array("status" => "error", "message" => "Setting not found", "value" => "919999999999")); // Fallback
}
?>