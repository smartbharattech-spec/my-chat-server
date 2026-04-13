<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ================= DB CONNECTION ================= */
// Database Connection
require_once 'config.php';

/* ================= READ INPUT ================= */
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!is_array($data)) {
    echo json_encode([
        "status" => false,
        "message" => "Invalid JSON"
    ]);
    exit;
}

$email = trim($data['email'] ?? '');

if ($email === '') {
    echo json_encode([
        "status" => false,
        "message" => "Email is required"
    ]);
    exit;
}

/* ================= FETCH PLANS ================= */
try {
    $sql = "
        SELECT 
            p.id,
            p.plan, 
            p.price, 
            p.status, 
            p.created_at,
            pr.project_name
        FROM payments p
        LEFT JOIN projects pr ON p.project_id = pr.id
        WHERE p.email = :email
        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['email' => $email]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($results) > 0) {
        $plans = [];
        foreach ($results as $row) {
            $plans[] = [
                "id" => $row['id'],
                "plan_name" => $row['plan'],
                "price" => $row['price'],
                "status" => $row['status'],
                "created_at" => $row['created_at'],
                "project_name" => $row['project_name'] ?? "N/A"
            ];
        }
        echo json_encode([
            "status" => true,
            "plans" => $plans
        ]);
    } else {
        echo json_encode([
            "status" => false,
            "message" => "No plans found for this account"
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        "status" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
exit;
exit;
