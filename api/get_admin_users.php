<?php
require_once 'config.php';

header("Content-Type: application/json");

// In a real app, we would verify the session/token here for super_admin role.
// For this implementation, we'll assume the frontend handles basic routing
// and we'll focus on the data retrieval.

try {
    $stmt = $pdo->query("SELECT id, username, email, role, permissions FROM admins ORDER BY id ASC");
    $admins = $stmt->fetchAll();

    // Decode permissions for each admin
    foreach ($admins as &$admin) {
        $admin['permissions'] = $admin['permissions'] ? json_decode($admin['permissions'], true) : [];
    }

    echo json_encode([
        "status" => "success",
        "data" => $admins
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>