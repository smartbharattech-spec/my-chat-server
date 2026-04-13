<?php
header("Content-Type: application/json");
require_once 'config.php';

$results = [];

function addColumnIfMissing($pdo, $table, $column, $definition, &$results)
{
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
            $results[] = "Successfully added column `$column` to table `$table`.";
        } else {
            $results[] = "Column `$column` already exists in table `$table`.";
        }
    } catch (PDOException $e) {
        $results[] = "Error processing `$table`.`$column`: " . $e->getMessage();
    }
}

// 1. Plans Table
addColumnIfMissing($pdo, 'plans', 'followup_enabled', "TINYINT(1) DEFAULT 0 AFTER is_free", $results);

// 2. Admins Table
addColumnIfMissing($pdo, 'admins', 'role', "ENUM('super_admin', 'staff') DEFAULT 'staff'", $results);
addColumnIfMissing($pdo, 'admins', 'permissions', "TEXT DEFAULT NULL", $results);

// 3. Projects Table
addColumnIfMissing($pdo, 'projects', 'plan_id', "INT(11) DEFAULT NULL", $results);
addColumnIfMissing($pdo, 'projects', 'last_followup_step', "INT(11) DEFAULT 0", $results);
addColumnIfMissing($pdo, 'projects', 'last_followup_at', "TIMESTAMP NULL DEFAULT NULL", $results);
addColumnIfMissing($pdo, 'projects', 'assigned_admin_id', "INT(11) DEFAULT NULL", $results);
addColumnIfMissing($pdo, 'projects', 'followup_status', "ENUM('none', 'pending', 'accepted', 'rejected') DEFAULT 'none'", $results);
addColumnIfMissing($pdo, 'projects', 'followup_accepted_at', "TIMESTAMP NULL DEFAULT NULL", $results);
addColumnIfMissing($pdo, 'projects', 'followup_start_at', "TIMESTAMP NULL DEFAULT NULL", $results);

// 4. Create Master Followup Table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_followups (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        days_interval INT(11) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $results[] = "Table `admin_followups` is ready.";
} catch (PDOException $e) {
    $results[] = "Error creating `admin_followups`: " . $e->getMessage();
}

echo json_encode(["status" => "success", "details" => $results]);
