<?php
require_once __DIR__ . '/../config.php';

try {
    $sqls = [
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS expertise_tags VARCHAR(512) DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS custom_details TEXT DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS intro_video_url VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS ai_exam_status ENUM('none', 'pending', 'started', 'completed', 'evaluated') DEFAULT 'none'",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS ai_exam_data JSON DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS ai_exam_marks DECIMAL(5,2) DEFAULT 0.00",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS ai_exam_remarks TEXT DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS admin_interview_questions JSON DEFAULT NULL",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS interview_status ENUM('pending', 'passed', 'failed') DEFAULT 'pending'",
        "CREATE TABLE IF NOT EXISTS marketplace_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        "INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES ('openai_api_key', '')",
        "INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES ('openai_instructions', 'You are an expert examiner for occult sciences. Generate 5 professional questions based on the expert\'s experience. Evaluate answers and provide diagnostic feedback.')",
        "INSERT IGNORE INTO marketplace_settings (setting_key, setting_value) VALUES ('expert_verification_enabled', 'on')",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE AFTER user_id",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS profile_image TEXT AFTER slug",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS banner_image TEXT AFTER profile_image",
        "ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS is_live TINYINT(1) DEFAULT 1 AFTER banner_image"
    ];

    foreach ($sqls as $sql) {
        $pdo->exec($sql);
        echo "Executed: " . substr($sql, 0, 50) . "... \n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
