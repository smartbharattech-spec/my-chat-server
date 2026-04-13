-- Run this script in your phpMyAdmin or MySQL terminal to create the Occult Marketplace tables.

-- Table: marketplace_users
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: expert_profiles
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
);

-- Table: marketplace_settings
CREATE TABLE IF NOT EXISTS marketplace_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES 
('openai_api_key', ''),
('openai_instructions', 'You are an expert evaluator for occult science experts (Vastu, Astrology, Numerology).'),
('expert_verification_enabled', 'on');

-- Insert a default admin for the marketplace
INSERT IGNORE INTO marketplace_users (name, email, phone, password_hash, role, status) 
VALUES ('Marketplace Admin', 'occultadmin@thesanatangurukul.com', '0000000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');
-- Password for admin is 'password' (using Laravel default bcrypt hash for 'password')
