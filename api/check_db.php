<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Checking Database Connection...</h1>";

try {
    // Manually testing the credentials from config.php
    $host = 'localhost';
    $dbname = 'u737940041_tool';
    $user = 'u737940041_tool';
    $pass = 'Yc*2wI0*xSk';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color:green'>✅ Database Connected Successfully!</p>";
    
    // Check if tables exist
    $tables = ['courses', 'course_topics', 'course_lessons', 'course_purchases'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            echo "<p>✅ Table '$table' exists.</p>";
        } else {
            echo "<p style='color:red'>❌ Table '$table' MISSING!</p>";
        }
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>❌ Connection Failed: " . $e->getMessage() . "</p>";
}
?>