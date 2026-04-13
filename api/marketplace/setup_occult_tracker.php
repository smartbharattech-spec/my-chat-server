<?php
require_once '../config.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `occult_tracker` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `user_name` VARCHAR(255) DEFAULT '',
            `user_email` VARCHAR(255) DEFAULT '',
            `expert_id` INT DEFAULT NULL,
            `problem` TEXT NOT NULL,
            `experience` TEXT DEFAULT '',
            `result_type` ENUM('positive','negative','neutral') DEFAULT 'neutral',
            `expert_remedy` TEXT DEFAULT '',
            `expert_comment` TEXT DEFAULT '',
            `expert_replied_at` DATETIME DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_user_id` (`user_id`),
            INDEX `idx_expert_id` (`expert_id`),
            INDEX `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo json_encode(['status' => 'success', 'message' => 'occult_tracker table created successfully']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
