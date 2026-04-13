<?php
require_once 'config.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

try {
    if ($action === 'create') {
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'staff';
        $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : json_encode([]);

        if (empty($username) || empty($email) || empty($password)) {
            echo json_encode(["status" => "error", "message" => "Required fields missing."]);
            exit;
        }

        // Check unique email
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["status" => "error", "message" => "Email already exists."]);
            exit;
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admins (username, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$username, $email, $hashed, $role, $permissions]);

        echo json_encode(["status" => "success", "message" => "Admin user created."]);

    } elseif ($action === 'update') {
        $id = $data['id'] ?? '';
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $role = $data['role'] ?? 'staff';
        $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : json_encode([]);

        if (empty($id) || empty($username) || empty($email)) {
            echo json_encode(["status" => "error", "message" => "Required fields missing."]);
            exit;
        }

        // Check if updating password
        if (!empty($data['password'])) {
            $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE admins SET username = ?, email = ?, password = ?, role = ?, permissions = ? WHERE id = ?");
            $stmt->execute([$username, $email, $hashed, $role, $permissions, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE admins SET username = ?, email = ?, role = ?, permissions = ? WHERE id = ?");
            $stmt->execute([$username, $email, $role, $permissions, $id]);
        }

        echo json_encode(["status" => "success", "message" => "Admin user updated."]);

    } elseif ($action === 'delete') {
        $id = $data['id'] ?? '';
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "ID missing."]);
            exit;
        }

        // Delete the admin user by ID
        $stmt = $pdo->prepare("DELETE FROM admins WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "Admin user deleted."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Could not delete user (perhaps it's a super_admin)."]);
        }

    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action."]);
    }

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>