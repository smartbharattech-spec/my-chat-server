<?php
header("Content-Type: application/json");
require_once 'config.php';

try {
    // Drop existing table if any
    $pdo->exec("DROP TABLE IF EXISTS admin_followups");

    // Create new table
    $sql = "CREATE TABLE admin_followups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        scheduled_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);

    // Add some initial data
    $stmt = $pdo->prepare("INSERT INTO admin_followups (title, scheduled_date) VALUES (?, ?)");
    $stmt->execute(['Sample Follow-up', date('Y-m-d')]);

    echo json_encode(["status" => "success", "message" => "Database table admin_followups created successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>