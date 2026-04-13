<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("DESCRIBE plans");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('is_free', $columns)) {
        $pdo->exec("ALTER TABLE plans ADD COLUMN is_free TINYINT(1) DEFAULT 0 AFTER device_limit");
        echo json_encode(["status" => "success", "message" => "Column 'is_free' added to 'plans' table."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Column 'is_free' already exists."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
