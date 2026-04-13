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

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$city = isset($input['city']) ? trim($input['city']) : '';
$state = isset($input['state']) ? trim($input['state']) : '';

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Name, email, and password are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM marketplace_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Email is already registered.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    // Begin Transaction to ensure both tables are updated
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO marketplace_users (name, email, phone, password_hash, role, status, city, state) VALUES (?, ?, ?, ?, 'user', 'active', ?, ?)");

    if ($stmt->execute([$name, $email, $phone, $hash, $city, $state])) {
        
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
            $stmtVastu = $pdo->prepare("INSERT INTO users (firstname, email, password, mobile, whatsapp, city, state, verification_token, is_verified, is_consultant, plan, plan_id, plan_activated_at, plan_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)");
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
        echo json_encode(['status' => 'success', 'message' => 'User registered successfully.']);
    } else {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Failed to register user.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
