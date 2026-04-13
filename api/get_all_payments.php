<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Joining payments with projects to get the project name
        // We assume email links them, or if there's a more direct link we should use it.
        // Looking at schema, they have email.
        $stmt = $pdo->query("
            SELECT 
                p.id, 
                p.email, 
                p.project_id,
                p.plan, 
                p.price, 
                p.status, 
                p.created_at,
                pr.project_name
            FROM payments p
            LEFT JOIN projects pr ON p.project_id = pr.id
            ORDER BY p.created_at DESC
        ");
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $payments
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
