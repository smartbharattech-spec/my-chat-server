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

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($email) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.phone, u.password_hash, u.role, u.status,
               ep.primary_skill, ep.experience_years, ep.bio, ep.slug
        FROM marketplace_users u
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User not found. Please check your email.']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['status' => 'error', 'message' => 'Incorrect password.']);
        exit;
    }

    if ($user['status'] === 'rejected') {
        echo json_encode(['status' => 'error', 'message' => 'Your account has been rejected by the admin.']);
        exit;
    }

    // Generate a simple token
    $tokenPayload = [
        'user_id' => $user['id'],
        'role' => $user['role'],
        'exp' => time() + (86400 * 30) // 30 days
    ];
    $token = base64_encode(json_encode($tokenPayload));

    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'status' => $user['status'],
            'primary_skill' => $user['primary_skill'],
            'experience_years' => $user['experience_years'],
            'bio' => $user['bio'],
            'slug' => $user['slug'],
            'token' => $token
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
