<?php
require_once __DIR__ . '/api/config.php';

try {
    // 1. Change the default of is_visible to 1 to match the intended schema
    $pdo->exec("ALTER TABLE expert_profiles ALTER COLUMN is_visible SET DEFAULT 1");
    echo "Default for is_visible set to 1.\n";

    // 2. Update existing experts to be visible (those who are active)
    $sql = "UPDATE expert_profiles ep
            JOIN marketplace_users u ON ep.user_id = u.id
            SET ep.is_visible = 1
            WHERE u.role = 'expert' AND u.status = 'active'";
    $affected = $pdo->exec($sql);
    echo "Updated $affected experts to be visible.\n";

    // 3. Verify
    $joinCount = $pdo->query("
        SELECT COUNT(*) 
        FROM marketplace_users u
        JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE u.role = 'expert' AND u.status = 'active' AND ep.is_visible = 1
    ")->fetchColumn();
    echo "Now, $joinCount experts should be returned by the API.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
