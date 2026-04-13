<?php
require_once 'api/config.php';
try {
    $pdo->exec("ALTER TABLE tracker_submissions ADD COLUMN problem TEXT NULL AFTER user_email");
    $pdo->exec("ALTER TABLE tracker_submissions ADD COLUMN steps TEXT NULL AFTER problem");
    $pdo->exec("ALTER TABLE tracker_submissions ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER experience");
    echo "Database updated successfully!";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
