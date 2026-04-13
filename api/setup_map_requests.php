<?php
require_once 'config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS map_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        project_name VARCHAR(255),
        requirements TEXT,
        contact_number VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_VALUE,
        updated_at TIMESTAMP DEFAULT CURRENT_VALUE ON UPDATE CURRENT_VALUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    // Note: CURRENT_VALUE is not a valid MySQL keyword for DEFAULT. It should be CURRENT_TIMESTAMP.
    // Let me fix that.
    $sql = "CREATE TABLE IF NOT EXISTS map_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        project_name VARCHAR(255),
        requirements TEXT,
        contact_number VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo json_encode(["status" => "success", "message" => "Table map_requests created successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>