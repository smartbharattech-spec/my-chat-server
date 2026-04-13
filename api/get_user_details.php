<?php
require_once 'config.php';

// Fetch details - strictly requires project_id or email
$email = $_GET['email'] ?? null;
$projectId = $_GET['project_id'] ?? null;

if (!$email && !$projectId) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters: email or project_id"]);
    exit;
}

try {
    if ($projectId) {
        $stmt = $pdo->prepare("SELECT * FROM user_property_details WHERE project_id = ? ORDER BY created_at DESC");
        $stmt->execute([$projectId]);
    } else {
        // Fallback to email for legacy or global records (where project_id is NULL)
        $stmt = $pdo->prepare("SELECT * FROM user_property_details WHERE email = ? AND project_id IS NULL ORDER BY created_at DESC");
        $stmt->execute([$email]);
    }

    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $details]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>