<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('SELECT id, email, project_name, follower_id, expert_id FROM projects ORDER BY id DESC LIMIT 5');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
