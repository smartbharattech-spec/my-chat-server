<?php
require_once 'config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'project_issue'");
    $column = $stmt->fetch();

    if (!$column) {
        $pdo->exec("ALTER TABLE projects ADD COLUMN project_issue VARCHAR(255) DEFAULT NULL AFTER construction_type");
        echo json_encode(["status" => "success", "message" => "Column 'project_issue' added successfully"]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'project_issue' already exists"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
