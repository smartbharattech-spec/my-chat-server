<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config.php';

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';
$skill = isset($_POST['skill']) ? trim($_POST['skill']) : '';
$experience = isset($_POST['experience']) ? (int) $_POST['experience'] : 0;
$bio = isset($_POST['bio']) ? trim($_POST['bio']) : '';
$expert_type = isset($_POST['expert_type']) ? trim($_POST['expert_type']) : 'consultant';
$city = isset($_POST['city']) ? trim($_POST['city']) : '';
$state = isset($_POST['state']) ? trim($_POST['state']) : '';

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Basic details (Name, Email, Password) are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM marketplace_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Email is already registered.']);
        exit;
    }

    $uploadPath = null;
    if (isset($_FILES['document']) && $_FILES['document']['error'] === UPLOAD_ERR_OK) {
        $targetDir = "uploads/experts/";
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }
        $fileName = time() . "_" . preg_replace("/[^a-zA-Z0-9.]/", "_", basename($_FILES['document']['name']));
        $targetFile = $targetDir . $fileName;

        if (move_uploaded_file($_FILES['document']['tmp_name'], $targetFile)) {
            $uploadPath = $targetFile;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to upload document.']);
            exit;
        }
    }

    // Begin Transaction to insert into both tables
    $pdo->beginTransaction();

    // Generate unique slug from name
    $slug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $name));
    $slugCheck = $pdo->prepare("SELECT id FROM expert_profiles WHERE slug = ?");
    $slugCheck->execute([$slug]);
    if ($slugCheck->fetch()) {
        $slug .= '-' . rand(1000, 9999);
    }

    // Check for auto-verification setting
    $verifySetting = $pdo->query("SELECT setting_value FROM marketplace_settings WHERE setting_key = 'expert_verification_enabled'")->fetchColumn();
    $autoVerify = ($verifySetting === 'off');

    $isVerified = $autoVerify ? 1 : 0;
    $status = 'active'; // Always active on registration now, but depends on is_verified for visibility in some cases
    $aiStatus = $autoVerify ? 'completed' : 'pending';
    $interviewStatus = $autoVerify ? 'passed' : 'pending';

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO marketplace_users (name, email, phone, password_hash, role, status, city, state) VALUES (?, ?, ?, ?, 'expert', 'active', ?, ?)");
    $stmt->execute([$name, $email, $phone, $hash, $city, $state]);
    $userId = $pdo->lastInsertId();

    $stmtProf = $pdo->prepare("INSERT INTO expert_profiles (user_id, slug, primary_skill, experience_years, bio, verification_document, expert_type, is_verified, ai_exam_status, interview_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmtProf->execute([$userId, $slug, $skill, $experience, $bio, $uploadPath, $expert_type, $isVerified, $aiStatus, $interviewStatus]);

    // --- VASTU TOOL SYNC ---
    // Check if user already exists in Vastu Tool 'users' table
    $stmtVastuCheck = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmtVastuCheck->execute([$email]);
    if (!$stmtVastuCheck->fetch()) {
        // Fetch default Free Plan
        $stmtPlan = $pdo->prepare("SELECT id, title, validity_days, credits FROM plans WHERE is_free = '1' LIMIT 1");
        $stmtPlan->execute();
        $freePlan = $stmtPlan->fetch(PDO::FETCH_ASSOC);
        
        $plan_id = $freePlan ? $freePlan['id'] : null;
        $plan_name = $freePlan ? $freePlan['title'] : null;
        $validity_days = $freePlan ? (int)$freePlan['validity_days'] : 0;
        $plan_expiry = ($freePlan && $validity_days > 0) ? date('Y-m-d H:i:s', strtotime("+$validity_days days")) : null;
        $activated_at = $plan_id ? date('Y-m-d H:i:s') : null;

        $verification_token = bin2hex(random_bytes(32));
        
        // Insert into 'users' table (Mapping 'name' to 'firstname')
        $stmtVastu = $pdo->prepare("INSERT INTO users (firstname, email, password, mobile, whatsapp, city, state, verification_token, is_verified, is_consultant, plan, plan_id, plan_activated_at, plan_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)");
        $stmtVastu->execute([
            $name, 
            $email, 
            $hash, 
            $phone, 
            $phone, 
            $city, 
            $state, 
            $verification_token, 
            $plan_name, 
            $plan_id, 
            $activated_at, 
            $plan_expiry
        ]);

        // Insert a payments record so the Free Plan shows in Plan Request History
        if ($plan_id && $plan_name) {
            $stmtPayment = $pdo->prepare("INSERT INTO payments (email, plan, plan_id, price, credits, status, purchase_type) VALUES (?, ?, ?, 0, ?, 'Active', 'new_purchase')");
            $stmtPayment->execute([
                $email,
                $plan_name,
                $plan_id,
                $freePlan['credits'] ?? 0
            ]);
        }
    }
    // --- END VASTU TOOL SYNC ---

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Expert registration successful! You can now log in and access your dashboard.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
