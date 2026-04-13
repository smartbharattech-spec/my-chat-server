<?php
header("Content-Type: application/json");
require_once 'config.php';

$action = $_GET['action'] ?? '';

try {
    // Auto-repair: Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admin_followups'")->rowCount();
    if ($tableCheck === 0) {
        $sql = "CREATE TABLE admin_followups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            days_interval INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        $pdo->exec($sql);
        // Add a sample if fresh
        $pdo->prepare("INSERT INTO admin_followups (title, days_interval) VALUES (?, ?)")
            ->execute(['Welcome Follow-up', 1]);
    }

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT * FROM admin_followups ORDER BY days_interval ASC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $data]);

    } elseif ($action === 'create') {
        $data = json_decode(file_get_contents("php://input"), true);
        $title = $data['title'] ?? '';
        $days = (int) ($data['days_interval'] ?? 0);

        if (!$title || $days <= 0)
            throw new Exception("Title and valid Days are required");

        $stmt = $pdo->prepare("INSERT INTO admin_followups (title, days_interval) VALUES (?, ?)");
        $stmt->execute([$title, $days]);
        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);

    } elseif ($action === 'update') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? '';
        $title = $data['title'] ?? '';
        $days = (int) ($data['days_interval'] ?? 0);

        if (!$id || !$title || $days <= 0)
            throw new Exception("All fields are required and Days must be > 0");

        $stmt = $pdo->prepare("UPDATE admin_followups SET title = ?, days_interval = ? WHERE id = ?");
        $stmt->execute([$title, $days, $id]);
        echo json_encode(["status" => "success"]);

    } elseif ($action === 'list_due') {
        $admin_id = $_GET['admin_id'] ?? null;
        $is_super = isset($_GET['is_super']) && $_GET['is_super'] === 'true';

        $sql = "SELECT p.id as project_id, p.project_name, p.email, p.last_followup_step, p.followup_start_at, p.assigned_admin_id,
                       f.id as followup_id, f.title as followup_title, f.days_interval 
                FROM projects p
                JOIN admin_followups f ON (p.last_followup_step + 1) = (SELECT COUNT(*) FROM admin_followups f2 WHERE f2.days_interval <= f.days_interval)
                WHERE p.followup_status = 'accepted' AND p.followup_start_at IS NOT NULL";

        $params = [];
        if (!$is_super && $admin_id) {
            $sql .= " AND p.assigned_admin_id = ?";
            $params[] = $admin_id;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate if due
        foreach ($projects as &$p) {
            $startDate = strtotime($p['followup_start_at']);
            $dueDate = $startDate + ($p['days_interval'] * 86400);
            $p['due_date'] = date('Y-m-d', $dueDate);
            $p['is_due'] = time() >= $dueDate;
            $p['days_remaining'] = ceil(($dueDate - time()) / 86400);
        }

        echo json_encode(["status" => "success", "data" => $projects]);

    } elseif ($action === 'mark_complete') {
        $data = json_decode(file_get_contents("php://input"), true);
        $project_id = $data['project_id'] ?? null;

        if (!$project_id)
            throw new Exception("Project ID is required");

        $stmt = $pdo->prepare("UPDATE projects SET last_followup_step = last_followup_step + 1, last_followup_at = NOW() WHERE id = ?");
        $stmt->execute([$project_id]);
        echo json_encode(["status" => "success", "message" => "Follow-up marked as completed."]);

    } elseif ($action === 'delete') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? '';

        if (!$id)
            throw new Exception("ID is required");

        $stmt = $pdo->prepare("DELETE FROM admin_followups WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success"]);

    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>