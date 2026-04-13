<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

try {
    echo "<h1>Starting Migration...</h1>";

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
    echo "<p>✅ Courses Table Created</p>";

    $pdo->exec("CREATE TABLE IF NOT EXISTS course_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Topics Table Created</p>";

    $pdo->exec("CREATE TABLE IF NOT EXISTS course_lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        video_url VARCHAR(500),
        video_filename VARCHAR(255),
        pdf_filename VARCHAR(255),
        sort_order INT DEFAULT 0,
        FOREIGN KEY (topic_id) REFERENCES course_topics(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Lessons Table Created</p>";

    $pdo->exec("CREATE TABLE IF NOT EXISTS course_purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        receipt_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Purchases Table Created</p>";

    echo "<h2 style='color:green'>Migration Successful! Everything is ready.</h2>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Migration Failed: " . $e->getMessage() . "</p>";
}
?>
