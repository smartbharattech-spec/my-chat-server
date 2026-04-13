<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

try {
    // 1. Community Posts table
    $sql = "CREATE TABLE IF NOT EXISTS community_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expert_id INT NOT NULL,
        content TEXT,
        image_url VARCHAR(500),
        likes_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);

    // 2. Community Comments table
    $sql = "CREATE TABLE IF NOT EXISTS community_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);

    // 3. Community Likes table (to prevent multiple likes from same user)
    $sql = "CREATE TABLE IF NOT EXISTS community_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql);

    echo json_encode(['status' => 'success', 'message' => 'Community tables created successfully.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
