<?php
require_once 'api/config.php';
$id = 2;
try {
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
    $stmt->execute([$id]);
    $course = $stmt->fetch();
    if ($course) {
        echo "Course 2 found: " . $course['title'] . "\n";
    } else {
        echo "Course 2 NOT found in database.\n";
        
        $stmt = $pdo->query("SELECT id, title FROM courses LIMIT 10");
        echo "Existing courses:\n";
        print_r($stmt->fetchAll());
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
