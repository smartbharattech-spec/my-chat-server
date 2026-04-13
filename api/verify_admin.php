<?php
error_reporting(0);
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? '';

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "Admin ID required."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, email, role, permissions FROM admins WHERE id = ?");
    $stmt->execute([$id]);
    $admin = $stmt->fetch();

    if ($admin) {
        $admin['permissions'] = $admin['permissions'] ? json_decode($admin['permissions'], true) : [];
        echo json_encode([
            "status" => "success",
            "admin" => $admin
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Admin not found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>