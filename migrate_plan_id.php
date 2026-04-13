<?php
require_once 'api/config.php';
try {
    // 1. Add plan_id column if it doesn't exist
    $pdo->exec("ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan_id INT NULL AFTER plan_name");
    echo "Column plan_id added or already exists.\n";

    // 2. Fetch all plans to create a mapping
    $stmt = $pdo->query("SELECT id, title FROM plans");
    $plans = $stmt->fetchAll();

    foreach ($plans as $plan) {
        $stmtUpdate = $pdo->prepare("UPDATE projects SET plan_id = ? WHERE plan_name = ?");
        $stmtUpdate->execute([$plan['id'], $plan['title']]);
        echo "Mapped plan '{$plan['title']}' to ID {$plan['id']}\n";
    }

    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>