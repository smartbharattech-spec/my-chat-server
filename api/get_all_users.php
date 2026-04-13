<?php
require_once 'config.php';

// Global CORS Handling is already in config.php

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT 
                    u.id, u.firstname, u.email, u.mobile, u.whatsapp, u.created_at, u.plan, u.plan_id, u.plan_expiry, u.plan_activated_at, u.is_consultant,
                    p.plan_type, p.credits as plan_limit,
                    (SELECT COUNT(*) FROM projects 
                     WHERE email = u.email 
                     AND (
                        (p.plan_type = 'subscription' AND u.plan_activated_at IS NOT NULL AND created_at >= u.plan_activated_at)
                        OR 
                        (p.plan_type = 'single' AND plan_id = u.plan_id)
                        OR
                        (p.plan_type IS NULL)
                     )
                    ) as project_usage,
                    (SELECT COUNT(*) FROM user_devices WHERE user_id = u.id) as device_count
                FROM users u 
                LEFT JOIN plans p ON u.plan_id = p.id 
                ORDER BY u.created_at DESC";
        $stmt = $pdo->query($sql);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $users
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>