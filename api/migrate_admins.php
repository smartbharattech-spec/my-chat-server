<?php
require_once 'config.php';

header("Content-Type: application/json");

try {
    // 1. Add 'role' column if not exists
    $pdo->exec("ALTER TABLE admins ADD COLUMN IF NOT EXISTS role ENUM('super_admin', 'staff') DEFAULT 'staff'");

    // 2. Add 'permissions' column if not exists
    $pdo->exec("ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT NULL");

    // 3. Set the first admin as super_admin
    $stmt = $pdo->query("SELECT id FROM admins ORDER BY id ASC LIMIT 1");
    $firstAdmin = $stmt->fetch();

    if ($firstAdmin) {
        $pdo->prepare("UPDATE admins SET role = 'super_admin' WHERE id = ?")->execute([$firstAdmin['id']]);
        $message = "Migration successful. First admin (ID: {$firstAdmin['id']}) set as super_admin.";
    } else {
        $message = "Migration successful, but no admin found to promote to super_admin.";
    }

    echo json_encode([
        "status" => "success",
        "message" => $message
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Migration failed: " . $e->getMessage()
    ]);
}
?>