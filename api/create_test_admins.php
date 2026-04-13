<?php
require_once 'config.php';
header("Content-Type: text/plain");

$perms = json_encode(['followups', 'followup_requests']);

$admins = [
    [
        'username' => 'Test Admin 1',
        'email' => 'admin1@example.com',
        'password' => password_hash('admin123', PASSWORD_BCRYPT),
        'role' => 'staff',
        'permissions' => $perms
    ],
    [
        'username' => 'Test Admin 2',
        'email' => 'admin2@example.com',
        'password' => password_hash('admin123', PASSWORD_BCRYPT),
        'role' => 'staff',
        'permissions' => $perms
    ]
];

try {
    $stmt = $pdo->prepare("INSERT INTO admins (username, email, password, role, permissions) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE permissions=VALUES(permissions), password=VALUES(password)");
    foreach ($admins as $admin) {
        $stmt->execute([
            $admin['username'],
            $admin['email'],
            $admin['password'],
            $admin['role'],
            $admin['permissions']
        ]);
        echo "Updated Admin: " . $admin['email'] . " with followup perms\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
