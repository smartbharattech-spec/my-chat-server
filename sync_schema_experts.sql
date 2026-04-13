-- SQL to sync missing columns in expert_profiles table
ALTER TABLE expert_profiles 
ADD COLUMN IF NOT EXISTS hourly_rate decimal(10,2) DEFAULT '0.00' AFTER rating,
ADD COLUMN IF NOT EXISTS languages varchar(255) DEFAULT NULL AFTER hourly_rate,
ADD COLUMN IF NOT EXISTS wallet_balance decimal(10,2) DEFAULT '0.00' AFTER languages,
ADD COLUMN IF NOT EXISTS is_visible tinyint(1) DEFAULT '1' AFTER is_verified,
ADD COLUMN IF NOT EXISTS digilocker_id varchar(100) DEFAULT NULL AFTER is_visible,
ADD COLUMN IF NOT EXISTS expertise_tags varchar(512) DEFAULT NULL AFTER digilocker_id,
ADD COLUMN IF NOT EXISTS custom_details text DEFAULT NULL AFTER expertise_tags,
ADD COLUMN IF NOT EXISTS intro_video_url varchar(255) DEFAULT NULL AFTER custom_details,
ADD COLUMN IF NOT EXISTS ai_exam_status enum('none','pending','started','completed','evaluated') DEFAULT 'none' AFTER intro_video_url,
ADD COLUMN IF NOT EXISTS ai_exam_data longtext DEFAULT NULL AFTER ai_exam_status,
ADD COLUMN IF NOT EXISTS ai_exam_marks decimal(5,2) DEFAULT '0.00' AFTER ai_exam_data,
ADD COLUMN IF NOT EXISTS ai_exam_remarks text DEFAULT NULL AFTER ai_exam_marks,
ADD COLUMN IF NOT EXISTS admin_interview_questions longtext DEFAULT NULL AFTER ai_exam_remarks,
ADD COLUMN IF NOT EXISTS interview_status enum('pending','passed','failed') DEFAULT 'pending' AFTER admin_interview_questions,
ADD COLUMN IF NOT EXISTS per_message_charge INT DEFAULT NULL AFTER expertise_tags;
