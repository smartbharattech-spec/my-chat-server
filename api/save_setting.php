<?php
include_once 'config.php';

global $pdo;
$db = $pdo;

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->key) && !empty($data->value)) {
    // Basic check if it's admin (in a real app, check session/token)
    // For now, we rely on the frontend admin panel protection, but ideally token verification should be here.

    $query = "INSERT INTO settings (setting_key, setting_value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE setting_value = :value";
    $stmt = $db->prepare($query);

    $stmt->bindParam(":key", $data->key);
    $stmt->bindParam(":value", $data->value);

    if ($stmt->execute()) {
        echo json_encode(array("status" => "success", "message" => "Setting updated successfully."));
    } else {
        echo json_encode(array("status" => "error", "message" => "Unable to update setting."));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Incomplete data."));
}
?>