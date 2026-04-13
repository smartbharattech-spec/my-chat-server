<?php
header("Content-Type: application/json");
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'submit') {
        $email = $data['email'] ?? '';
        $rating = $data['rating'] ?? 5;
        $comment = $data['comment'] ?? '';
        $profit = $data['profit_impact'] ?? '';
        $remedyName = $data['remedy_name'] ?? '';
        $sentiment = $data['sentiment'] ?? 'Positive';

        if (empty($email)) {
            echo json_encode(["status" => "error", "message" => "Email is required"]);
            exit;
        }

        try {
            // Get user_id from users table
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            $user_id = $user ? $user['id'] : 0;

            $stmt = $pdo->prepare("INSERT INTO reviews (user_id, email, rating, comment, profit_impact, remedy_name, sentiment, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([$user_id, $email, $rating, $comment, $profit, $remedyName, $sentiment]);
            echo json_encode(["status" => "success", "message" => "Review submitted for approval"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'submit_bulk') {
        $email = $data['email'] ?? '';
        $reviews = $data['reviews'] ?? [];

        if (empty($email)) {
            echo json_encode(["status" => "error", "message" => "Email is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            $user_id = $user ? $user['id'] : 0;

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO reviews (user_id, email, rating, comment, remedy_name, status) VALUES (?, ?, ?, ?, ?, 'pending')");
            foreach ($reviews as $rev) {
                $rating = $rev['rating'] ?? 5;
                $comment = $rev['comment'] ?? '';
                $remedyName = $rev['remedy_name'] ?? 'General';

                if (!empty($comment)) {
                    $stmt->execute([$user_id, $email, $rating, $comment, $remedyName]);
                }
            }
            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "All reviews submitted successfully"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT r.*, u.firstname 
                           FROM reviews r 
                           LEFT JOIN users u ON r.email = u.email 
                           ORDER BY r.created_at DESC");
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $reviews]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>