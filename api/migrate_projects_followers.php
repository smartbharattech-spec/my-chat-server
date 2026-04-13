<?php
require_once 'config.php';

try {
    echo "Starting migration...<br>";

    // Add expert_id column
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'expert_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE projects ADD COLUMN expert_id INT NULL AFTER email");
        echo "Column 'expert_id' added.<br>";
    } else {
        echo "Column 'expert_id' already exists.<br>";
    }

    // Add follower_id column
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'follower_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE projects ADD COLUMN follower_id INT NULL AFTER expert_id");
        echo "Column 'follower_id' added.<br>";
    } else {
        echo "Column 'follower_id' already exists.<br>";
    }

    // Add index for performance
    $stmt = $pdo->query("SHOW INDEX FROM projects WHERE Key_name = 'idx_expert_follower'");
    if (!$stmt->fetch()) {
        $pdo->exec("CREATE INDEX idx_expert_follower ON projects(expert_id, follower_id)");
        echo "Index 'idx_expert_follower' added.<br>";
    } else {
        echo "Index 'idx_expert_follower' already exists.<br>";
    }

    echo "<strong>Migration completed successfully.</strong>";
} catch (Exception $e) {
    echo "<strong>Error:</strong> " . $e->getMessage();
}
?>
