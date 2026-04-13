<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = isset($_GET['admin_id']) ? (int)$_GET['admin_id'] : (isset($_POST['admin_id']) ? (int)$_POST['admin_id'] : 0);

// Basic JSON body reading if method is POST/PUT
$input = json_decode(file_get_contents('php://input'), true);
if ($input && isset($input['admin_id'])) {
    $admin_id = (int)$input['admin_id'];
}

if (!$admin_id) {
    echo json_encode(['status' => 'error', 'message' => 'Admin ID is required.']);
    exit;
}

try {
    // Verify Admin Role
    $stmt = $pdo->prepare("SELECT role FROM marketplace_users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin access required.']);
        exit;
    }

    if ($method === 'GET') {
        // List plans
        $stmt = $pdo->query("SELECT * FROM marketplace_credit_plans ORDER BY credits ASC");
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $plans]);
        
    } elseif ($method === 'POST') {
        // Create plan
        if (!$input) $input = $_POST;
        $name = isset($input['plan_name']) ? trim($input['plan_name']) : '';
        $credits = isset($input['credits']) ? (int)$input['credits'] : 0;
        $price = isset($input['price']) ? (float)$input['price'] : 0;
        
        if (!$name || $credits <= 0 || $price < 0) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid plan details.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO marketplace_credit_plans (plan_name, credits, price, status) VALUES (?, ?, ?, 'active')");
        $stmt->execute([$name, $credits, $price]);
        
        echo json_encode(['status' => 'success', 'message' => 'Credit plan created successfully.']);
        
    } elseif ($method === 'PUT') {
        // Update plan status (toggle active/inactive)
        if (!$input) $input = json_decode(file_get_contents('php://input'), true);
        $plan_id = isset($input['plan_id']) ? (int)$input['plan_id'] : 0;
        $status = isset($input['status']) ? $input['status'] : 'active';
        
        if (!$plan_id || !in_array($status, ['active', 'inactive'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid update parameters.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE marketplace_credit_plans SET status = ? WHERE id = ?");
        $stmt->execute([$status, $plan_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Plan status updated.']);
        
    } elseif ($method === 'DELETE') {
        // Delete plan (only if not linked to requests, or handle cascade)
        $plan_id = isset($_GET['plan_id']) ? (int)$_GET['plan_id'] : (isset($input['plan_id']) ? (int)$input['plan_id'] : 0);
        
        if (!$plan_id) {
            echo json_encode(['status' => 'error', 'message' => 'Plan ID required for deletion.']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM marketplace_credit_plans WHERE id = ?");
        $stmt->execute([$plan_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Plan deleted.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    }

} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['status' => 'error', 'message' => 'Cannot delete this plan because it is linked to user requests. Consider disabling it instead.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
