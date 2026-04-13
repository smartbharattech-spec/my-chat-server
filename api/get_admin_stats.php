<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Total Users
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $totalUsers = $stmt->fetch()['total'];

        // Total Projects
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM projects");
        $totalProjects = $stmt->fetch()['total'];

        // Total Payments (Sum of price or just count - using count for now as price is string)
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM payments");
        $totalPaymentsCount = $stmt->fetch()['total'];
        
        // Successful Payments
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM payments WHERE status = 'Active'");
        $activeSubscribers = $stmt->fetch()['total'];

        echo json_encode([
            "status" => "success",
            "data" => [
                "totalUsers" => $totalUsers,
                "totalProjects" => $totalProjects,
                "totalPayments" => $totalPaymentsCount,
                "activeSubscribers" => $activeSubscribers
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
