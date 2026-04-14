<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $email = $_GET['email'] ?? null;
        if (!$email) {
            echo json_encode(["status" => "error", "message" => "Email is required"]);
            break;
        }

        try {
            // Function to get all possible IDs for an email
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? UNION SELECT id FROM marketplace_users WHERE email = ?");
            $stmt->execute([$email, $email]);
            $userIds = array_unique(array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN)));
            
            // Fetch folders with project counts (using the same ownership filter as projects.php)
            $ownershipWhere = "";
            $params_own = [$email];
            if (!empty($userIds)) {
                $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
                $ownershipWhere = "AND (p.follower_id IN ($placeholders) OR p.expert_id IN ($placeholders) OR p.email = ?)";
                $params_own = array_merge($userIds, $userIds, [$email]);
            } else {
                $ownershipWhere = "AND p.email = ?";
            }

            $folderSql = "SELECT f.*, 
                         (SELECT COUNT(*) FROM projects p WHERE p.folder_id = f.id $ownershipWhere) as project_count 
                         FROM workspace_folders f WHERE f.user_email = ? ORDER BY f.created_at DESC";
            $stmt = $pdo->prepare($folderSql);
            $stmt->execute(array_merge($params_own, [$email]));
            $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch root count (projects with NO folder_id) using ownership logic
            if (!empty($userIds)) {
                $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
                $rootSql = "SELECT COUNT(*) FROM projects WHERE folder_id IS NULL AND (follower_id IN ($placeholders) OR expert_id IN ($placeholders) OR email = ?)";
                $rootStmt = $pdo->prepare($rootSql);
                $rootStmt->execute(array_merge($userIds, $userIds, [$email]));
            } else {
                $rootStmt = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE folder_id IS NULL AND email = ?");
                $rootStmt->execute([$email]);
            }
            $rootCount = $rootStmt->fetchColumn();

            echo json_encode(["status" => "success", "data" => $folders, "root_count" => (int)$rootCount]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $email = $data['email'] ?? null;
        $folder_name = $data['folder_name'] ?? null;

        if (!$email || !$folder_name) {
            echo json_encode(["status" => "error", "message" => "Email and folder name are required"]);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO workspace_folders (user_email, folder_name) VALUES (?, ?)");
            $stmt->execute([$email, $folder_name]);
            echo json_encode(["status" => "success", "message" => "Folder created successfully", "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $folder_name = $data['folder_name'] ?? null;
        $email = $data['email'] ?? null;

        if (!$id || !$folder_name || !$email) {
            echo json_encode(["status" => "error", "message" => "ID, email and folder name are required"]);
            break;
        }

        try {
            $stmt = $pdo->prepare("UPDATE workspace_folders SET folder_name = ? WHERE id = ? AND user_email = ?");
            $stmt->execute([$folder_name, $id, $email]);
            echo json_encode(["status" => "success", "message" => "Folder updated successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? ($_GET['id'] ?? null);
        $email = $data['email'] ?? ($_GET['email'] ?? null);

        if (!$id || !$email) {
            echo json_encode(["status" => "error", "message" => "ID and email are required"]);
            break;
        }

        try {
            // Projects inside will automatically have folder_id set to NULL due to FOREIGN KEY (folder_id) REFERENCES workspace_folders(id) ON DELETE SET NULL
            $stmt = $pdo->prepare("DELETE FROM workspace_folders WHERE id = ? AND user_email = ?");
            $stmt->execute([$id, $email]);
            echo json_encode(["status" => "success", "message" => "Folder deleted successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
        break;
}
?>
