<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$name = isset($input['name']) ? trim($input['name']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$role = isset($input['role']) ? $input['role'] : '';
$city = isset($input['city']) ? trim($input['city']) : '';
$state = isset($input['state']) ? trim($input['state']) : '';

if (!$user_id || empty($name) || empty($phone)) {
    echo json_encode(['status' => 'error', 'message' => 'User ID, Name, and Phone are required.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Update basic user details
    $stmt = $pdo->prepare("UPDATE marketplace_users SET name = ?, phone = ?, city = ?, state = ? WHERE id = ?");
    $stmt->execute([$name, $phone, $city, $state, $user_id]);

    // 2. If expert, update expert profile details
    if ($role === 'expert') {
        $skill = isset($input['skill']) ? trim($input['skill']) : '';
        $experience = isset($input['experience']) ? (int)$input['experience'] : 0;
        $bio = isset($input['bio']) ? trim($input['bio']) : '';
        $slug = isset($input['slug']) ? trim($input['slug']) : '';
        $is_live = isset($input['is_live']) ? (int)$input['is_live'] : (isset($input['isLive']) ? (int)$input['isLive'] : 1);
        $is_ecommerce_enabled = isset($input['is_ecommerce_enabled']) ? (int)$input['is_ecommerce_enabled'] : (isset($input['isEcommerceEnabled']) ? (int)$input['isEcommerceEnabled'] : 0);
        $hourly_rate = isset($input['hourly_rate']) ? (float)$input['hourly_rate'] : 0.00;
        $languages = isset($input['language']) ? trim($input['language']) : (isset($input['languages']) ? trim($input['languages']) : '');
        $expertise_tags = isset($input['skills']) ? trim($input['skills']) : '';
        $per_message_charge = isset($input['per_message_charge']) ? (int)$input['per_message_charge'] : null;
        $free_message_limit = isset($input['free_message_limit']) ? (int)$input['free_message_limit'] : 0;

        // If skill (primary skill) is empty but we have tags, use the first tag
        if (empty($skill) && !empty($expertise_tags)) {
            $tags_array = explode(',', $expertise_tags);
            $skill = trim($tags_array[0]);
        }

        // Auto-generate slug if empty
        if (empty($slug)) {
            $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)) . '-' . rand(1000, 9999);
        } else {
            // Sanitize provided slug
            $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $slug));
        }

        // Check if profile exists
        $checkStmt = $pdo->prepare("SELECT id, slug FROM expert_profiles WHERE user_id = ?");
        $checkStmt->execute([$user_id]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Check if slug is taken by someone else
            $slugCheck = $pdo->prepare("SELECT user_id FROM expert_profiles WHERE slug = ? AND user_id != ?");
            $slugCheck->execute([$slug, $user_id]);
            if ($slugCheck->fetch()) {
                $slug .= '-' . rand(100, 999); // De-duplicate
            }

            $stmtProf = $pdo->prepare("UPDATE expert_profiles SET primary_skill = ?, experience_years = ?, bio = ?, slug = ?, is_live = ?, is_ecommerce_enabled = ?, hourly_rate = ?, languages = ?, expertise_tags = ?, per_message_charge = ?, free_message_limit = ? WHERE user_id = ?");
            $stmtProf->execute([$skill, $experience, $bio, $slug, $is_live, $is_ecommerce_enabled, $hourly_rate, $languages, $expertise_tags, $per_message_charge, $free_message_limit, $user_id]);
        } else {
            $stmtProf = $pdo->prepare("INSERT INTO expert_profiles (user_id, slug, is_live, is_ecommerce_enabled, primary_skill, experience_years, bio, hourly_rate, languages, expertise_tags, per_message_charge, free_message_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtProf->execute([$user_id, $slug, $is_live, $is_ecommerce_enabled, $skill, $experience, $bio, $hourly_rate, $languages, $expertise_tags, $per_message_charge, $free_message_limit]);
        }
    }

    $pdo->commit();

    // Fetch updated user data to return
    $stmt = $pdo->prepare("SELECT id, name, email, phone, role, status, city, state FROM marketplace_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'data' => $updatedUser
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
