<?php
/**
 * Database Synchronization Script for Occult Marketplace
 * Run this script to ensure all necessary tables and columns exist in the database.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$results = [];

function executeQuery($pdo, $sql, $description, &$results) {
    try {
        $pdo->exec($sql);
        $results[] = ["status" => "success", "message" => $description . " - Done"];
    } catch (PDOException $e) {
        $results[] = ["status" => "error", "message" => $description . " - Failed: " . $e->getMessage()];
    }
}

try {
    // 1. Marketplace Users (Basic columns)
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('user', 'expert', 'admin') DEFAULT 'user',
            status ENUM('active', 'pending', 'rejected') DEFAULT 'active',
            city VARCHAR(100),
            state VARCHAR(100),
            is_online TINYINT(1) DEFAULT 0,
            last_seen TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_users table", $results);

    // 2. Expert Profiles
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS expert_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            slug VARCHAR(255) UNIQUE,
            primary_skill VARCHAR(100) NOT NULL,
            expertise_tags VARCHAR(500),
            experience_years INT NOT NULL,
            bio TEXT,
            custom_details TEXT,
            intro_video_url VARCHAR(500),
            verification_document VARCHAR(500),
            expert_type ENUM('teacher', 'consultant') DEFAULT 'consultant',
            profile_image VARCHAR(500),
            banner_image VARCHAR(500),
            ai_exam_status VARCHAR(50) DEFAULT 'pending',
            ai_exam_data LONGTEXT,
            ai_exam_marks INT DEFAULT 0,
            ai_exam_remarks TEXT,
            interview_status VARCHAR(50) DEFAULT 'pending',
            is_verified TINYINT(1) DEFAULT 0,
            is_visible TINYINT(1) DEFAULT 1,
            is_live TINYINT(1) DEFAULT 1,
            hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
            languages VARCHAR(255),
            rating DECIMAL(3, 2) DEFAULT 0.00,
            wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified expert_profiles table", $results);

    // 3. Marketplace Settings
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_settings table", $results);

    // 4. Marketplace Products
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            image_url VARCHAR(500),
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_products table", $results);

    // 5. Marketplace Orders
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            expert_id INT NOT NULL,
            product_id INT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'on_hold') DEFAULT 'pending',
            payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id),
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id),
            FOREIGN KEY (product_id) REFERENCES marketplace_products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_orders table", $results);

    // 6. Expert Wallets
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS expert_wallets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT NOT NULL UNIQUE,
            balance DECIMAL(10, 2) DEFAULT 0.00,
            total_earned DECIMAL(10, 2) DEFAULT 0.00,
            total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified expert_wallets table", $results);

    // 7. Wallet Transactions
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            wallet_id INT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            type ENUM('credit', 'debit') NOT NULL,
            status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
            order_id INT DEFAULT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_id) REFERENCES expert_wallets(id),
            FOREIGN KEY (order_id) REFERENCES marketplace_orders(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified wallet_transactions table", $results);

    // 8. Occult Tracker
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS occult_tracker (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_name VARCHAR(255) DEFAULT '',
            user_email VARCHAR(255) DEFAULT '',
            expert_id INT DEFAULT NULL,
            problem TEXT NOT NULL,
            experience TEXT DEFAULT '',
            result_type ENUM('positive','negative','neutral') DEFAULT 'neutral',
            status ENUM('open', 'assigned', 'resolved', 'closed') DEFAULT 'open',
            expert_remedy TEXT DEFAULT '',
            expert_comment TEXT DEFAULT '',
            expert_replied_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_expert_id (expert_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified occult_tracker table", $results);

    // 9. Occult Tracker Guidance (History/Steps)
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS occult_tracker_guidance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tracker_id INT NOT NULL,
            expert_remedy TEXT,
            expert_task TEXT,
            expert_comment TEXT,
            product_id INT DEFAULT NULL,
            product_ids TEXT DEFAULT NULL,
            user_action TEXT,
            user_feedback TEXT,
            final_result TEXT,
            result_type ENUM('positive', 'negative', 'neutral') DEFAULT 'neutral',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (tracker_id) REFERENCES occult_tracker(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified occult_tracker_guidance table", $results);

    // 10. Marketplace Notifications
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            status ENUM('unread', 'read') DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_notifications table", $results);

    // 11. Chat Tables
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user1_id INT NOT NULL,
            user2_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY (user1_id, user2_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified chat_conversations table", $results);

    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified chat_messages table", $results);

    // 12. Credit System Tables
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_credit_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT DEFAULT 0,
            plan_name VARCHAR(100) NOT NULL,
            credits INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_credit_plans table", $results);

    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_credit_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            credits INT NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id) REFERENCES marketplace_credit_plans(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_credit_requests table", $results);

    // 13. E-commerce Tables (Order Items & Coupons)
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            expert_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            price DECIMAL(10, 2) NOT NULL,
            selected_attributes JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE,
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_order_items table", $results);

    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_type ENUM('percentage', 'fixed') NOT NULL,
            discount_value DECIMAL(10,2) NOT NULL,
            max_uses INT DEFAULT 0,
            current_uses INT DEFAULT 0,
            valid_until DATETIME,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_coupons table", $results);

    // 14. Community Tables
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS community_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT NOT NULL,
            content TEXT,
            image_url VARCHAR(500),
            likes_count INT DEFAULT 0,
            shares_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified community_posts table", $results);

    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS community_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            user_id INT NOT NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified community_comments table", $results);

    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS community_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_like (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES marketplace_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified community_likes table", $results);

    // 15. Master Store Imports
    executeQuery($pdo, "
        CREATE TABLE IF NOT EXISTS marketplace_expert_imports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expert_id INT NOT NULL,
            product_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_import` (expert_id, product_id),
            FOREIGN KEY (expert_id) REFERENCES marketplace_users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ", "Created/Verified marketplace_expert_imports table", $results);

    // Default Settings Insertion
    executeQuery($pdo, "
        INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES 
        ('openai_api_key', ''),
        ('openai_instructions', 'You are an expert evaluator for occult science experts (Vastu, Astrology, Numerology).'),
        ('expert_verification_enabled', 'on');
    ", "Inserted default settings", $results);

    // Default Credit Plans
    executeQuery($pdo, "
        INSERT IGNORE INTO marketplace_credit_plans (id, expert_id, plan_name, credits, price, status) VALUES 
        (1, 0, 'Starter Pack', 10, 100.00, 'active'),
        (2, 0, 'Economy Pack', 25, 200.00, 'active'),
        (3, 0, 'Pro Pack', 75, 500.00, 'active'),
        (4, 0, 'Business Pack', 200, 1200.00, 'active');
    ", "Inserted default credit plans", $results);

    echo json_encode(["status" => "success", "results" => $results]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Sync failed: " . $e->getMessage(), "results" => $results]);
}
