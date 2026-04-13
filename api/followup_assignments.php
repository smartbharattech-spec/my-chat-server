<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list_pending':
        try {
            $stmt = $pdo->query("SELECT p.*, pl.title as plan_title 
                               FROM projects p 
                               LEFT JOIN plans pl ON p.plan_id = pl.id 
                               WHERE p.followup_status = 'pending' 
                               ORDER BY p.created_at ASC");
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $projects]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'accept':
        $data = json_decode(file_get_contents("php://input"), true);
        $project_id = $data['project_id'] ?? null;
        $admin_id = $data['admin_id'] ?? null;

        if (!$project_id || !$admin_id) {
            echo json_encode(["status" => "error", "message" => "Project ID and Admin ID are required."]);
            break;
        }

        try {
            // Check if already assigned
            $check = $pdo->prepare("SELECT assigned_admin_id FROM projects WHERE id = ?");
            $check->execute([$project_id]);
            $current = $check->fetch();

            if ($current && $current['assigned_admin_id']) {
                echo json_encode(["status" => "error", "message" => "Project already assigned to another admin."]);
                break;
            }

            $stmt = $pdo->prepare("UPDATE projects SET assigned_admin_id = ?, followup_status = 'accepted', followup_accepted_at = NOW() WHERE id = ?");
            $stmt->execute([$admin_id, $project_id]);
            echo json_encode(["status" => "success", "message" => "Project accepted and assigned successfully."]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'reject':
        $data = json_decode(file_get_contents("php://input"), true);
        $project_id = $data['project_id'] ?? null;

        if (!$project_id) {
            echo json_encode(["status" => "error", "message" => "Project ID is required."]);
            break;
        }

        try {
            $stmt = $pdo->prepare("UPDATE projects SET followup_status = 'rejected' WHERE id = ?");
            $stmt->execute([$project_id]);
            echo json_encode(["status" => "success", "message" => "Project assignment rejected."]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'list_assigned':
        $admin_id = $_GET['admin_id'] ?? null;
        if (!$admin_id) {
            echo json_encode(["status" => "error", "message" => "Admin ID is required."]);
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT p.*, pl.title as plan_title 
                                 FROM projects p 
                                 LEFT JOIN plans pl ON p.plan_id = pl.id 
                                 WHERE p.assigned_admin_id = ? 
                                 AND p.followup_status = 'accepted' 
                                 ORDER BY p.followup_accepted_at DESC");
            $stmt->execute([$admin_id]);
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $projects]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid action."]);
        break;
}
?>