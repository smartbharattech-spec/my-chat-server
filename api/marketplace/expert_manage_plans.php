<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'GET') {
        $expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : 0;
        if (!$expert_id) {
            echo json_encode(['status' => 'error', 'message' => 'Expert ID required']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_plans WHERE expert_id = ? ORDER BY credits ASC");
        $stmt->execute([$expert_id]);
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $plans]);

    } elseif ($method === 'POST') {
        $action = $input['action'] ?? '';
        $expert_id = (int)($input['expert_id'] ?? 0);
        
        if (!$expert_id) {
            echo json_encode(['status' => 'error', 'message' => 'Expert ID required']);
            exit;
        }

        if ($action === 'create') {
            $name = $input['plan_name'] ?? '';
            $credits = (int)($input['credits'] ?? 0);
            $price = (float)($input['price'] ?? 0);

            if (!$name || !$credits || !$price) {
                echo json_encode(['status' => 'error', 'message' => 'Missing plan details']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO marketplace_credit_plans (expert_id, plan_name, credits, price, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([$expert_id, $name, $credits, $price]);
            echo json_encode(['status' => 'success', 'message' => 'Plan created successfully']);

        } elseif ($action === 'update') {
            $plan_id = (int)($input['plan_id'] ?? 0);
            $name = $input['plan_name'] ?? '';
            $credits = (int)($input['credits'] ?? 0);
            $price = (float)($input['price'] ?? 0);
            $status = $input['status'] ?? 'active';

            if (!$plan_id || !$name || !$credits || !$price) {
                echo json_encode(['status' => 'error', 'message' => 'Missing plan details']);
                exit;
            }

            // Verify ownership
            $check = $pdo->prepare("SELECT expert_id FROM marketplace_credit_plans WHERE id = ?");
            $check->execute([$plan_id]);
            if ($check->fetchColumn() != $expert_id) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE marketplace_credit_plans SET plan_name = ?, credits = ?, price = ?, status = ? WHERE id = ? AND expert_id = ?");
            $stmt->execute([$name, $credits, $price, $status, $plan_id, $expert_id]);
            echo json_encode(['status' => 'success', 'message' => 'Plan updated successfully']);

        } elseif ($action === 'delete') {
            $plan_id = (int)($input['plan_id'] ?? 0);
            if (!$plan_id) {
                echo json_encode(['status' => 'error', 'message' => 'Plan ID required']);
                exit;
            }

            // Verify ownership
            $check = $pdo->prepare("SELECT expert_id FROM marketplace_credit_plans WHERE id = ?");
            $check->execute([$plan_id]);
            if ($check->fetchColumn() != $expert_id) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM marketplace_credit_plans WHERE id = ? AND expert_id = ?");
            $stmt->execute([$plan_id, $expert_id]);
            echo json_encode(['status' => 'success', 'message' => 'Plan deleted successfully']);
        }
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
