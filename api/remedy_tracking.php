<?php
header("Content-Type: application/json");
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'track') {
        $email = $data['email'] ?? '';
        $projectId = $data['project_id'] ?? 0;
        $remedyName = $data['remedy_name'] ?? '';
        $profit = $data['profit_earned'] ?? 0;
        $benefit = $data['benefit_percentage'] ?? 0;
        $status = $data['status'] ?? 'applied';
        $notes = $data['user_notes'] ?? '';

        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            $user_id = $user ? $user['id'] : 0;

            // Check if already tracking this remedy for this project
            $stmt = $pdo->prepare("SELECT id FROM remedy_tracking WHERE project_id = ? AND remedy_name = ?");
            $stmt->execute([$projectId, $remedyName]);
            $existing = $stmt->fetch();

            if ($existing) {
                $stmt = $pdo->prepare("UPDATE remedy_tracking SET profit_earned = ?, benefit_percentage = ?, status = ?, user_notes = ? WHERE id = ?");
                $stmt->execute([$profit, $benefit, $status, $notes, $existing['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO remedy_tracking (user_id, project_id, remedy_name, profit_earned, benefit_percentage, status, user_notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $projectId, $remedyName, $profit, $benefit, $status, $notes]);
            }
            echo json_encode(["status" => "success", "message" => "Outcome tracked successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'GET') {
    $projectId = $_GET['project_id'] ?? 0;
    try {
        $stmt = $pdo->prepare("SELECT * FROM remedy_tracking WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $tracks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $tracks]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>