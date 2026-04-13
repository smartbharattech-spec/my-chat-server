<?php
header('Content-Type: application/json');
require_once '../config.php';

$expert_id = isset($_GET['expert_id']) ? $_GET['expert_id'] : null;

try {
    if ($expert_id !== null && (int)$expert_id > 0) {
        // Fetch ONLY for this expert
        $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_plans WHERE expert_id = ? AND status = 'active' ORDER BY credits ASC");
        $stmt->execute([(int)$expert_id]);
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $source = 'expert';
    } else {
        // Fetch system plans
        $stmt = $pdo->prepare("SELECT * FROM marketplace_credit_plans WHERE expert_id = 0 AND status = 'active' ORDER BY credits ASC");
        $stmt->execute();
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $source = 'system';
    }
    
    echo json_encode(['status' => 'success', 'data' => $plans, 'source' => $source, 'requested_id' => $expert_id]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>

