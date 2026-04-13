<?php
require_once 'config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'project_data'");
    $column = $stmt->fetch();

    if (!$column) {
        $pdo->exec("ALTER TABLE projects ADD COLUMN project_data LONGTEXT DEFAULT NULL");
        echo json_encode(["status" => "success", "message" => "Column 'project_data' added successfully"]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'project_data' already exists"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>