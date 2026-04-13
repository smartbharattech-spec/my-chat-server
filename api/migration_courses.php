<?php
define('NO_JSON_HEADER', true);
require_once 'config.php';

echo "<h1>Database Migration Status</h1>";

try {
    // 1. Create Courses
    $pdo->exec("CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0.00,
        thumbnail VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        expert_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "<p>✅ Courses table ready</p>";

    // 2. Create Topics
    $pdo->exec("CREATE TABLE IF NOT EXISTS course_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Topics table ready</p>";

    // 3. Create Lessons
    $pdo->exec("CREATE TABLE IF NOT EXISTS course_lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        video_url VARCHAR(500),
        video_filename VARCHAR(255),
        pdf_filename VARCHAR(255),
        sort_order INT DEFAULT 0
    )");
    
    // Add missing video_url column if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM course_lessons LIKE 'video_url'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE course_lessons ADD COLUMN video_url VARCHAR(500) AFTER content");
    }
    echo "<p>✅ Lessons table ready</p>";

    echo "<h3>System Online! Please try to refresh your page now.</h3>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
}
?>
