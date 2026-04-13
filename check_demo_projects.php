<?php
require 'api/config.php';
$email = 'demo@gmail.com';
try {
    $stmt = $pdo->prepare("SELECT id, project_name, plan_id, plan_name FROM projects WHERE email = ?");
    $stmt->execute([$email]);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "current PROJECTS for $email:\n";
    print_r($projects);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>