<?php
header("Content-Type: application/json");
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($action === 'list_reviews') {
    try {
        $stmt = $pdo->query("SELECT * FROM reviews ORDER BY created_at DESC");
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $reviews]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($action === 'update_review') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    $status = $data['status'] ?? 'pending';
    try {
        $stmt = $pdo->prepare("UPDATE reviews SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(["status" => "success", "message" => "Review updated"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($action === 'delete_review') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    try {
        $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Review deleted"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($action === 'analytics') {
    try {
        // Aggregate profit per remedy
        $stmt = $pdo->query("SELECT remedy_name, 
                            COUNT(*) as total_users, 
                            SUM(profit_earned) as total_profit, 
                            AVG(benefit_percentage) as avg_benefit 
                            FROM remedy_tracking 
                            GROUP BY remedy_name 
                            ORDER BY total_profit DESC");
        $remedy_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get detailed user outcomes
        $stmt = $pdo->query("SELECT t.*, u.firstname, u.email, p.project_name 
                            FROM remedy_tracking t 
                            JOIN users u ON t.user_id = u.id 
                            JOIN projects p ON t.project_id = p.id 
                            ORDER BY t.created_at DESC");
        $user_outcomes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->query("SELECT remedy_name, 
                            COUNT(*) as total_reviews, 
                            SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as positive_count,
                            SUM(CASE WHEN rating < 3 THEN 1 ELSE 0 END) as negative_count
                            FROM reviews 
                            WHERE remedy_name IS NOT NULL AND remedy_name != ''
                            GROUP BY remedy_name");
        $remedy_sentiment = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "remedy_stats" => $remedy_stats,
            "user_outcomes" => $user_outcomes,
            "remedy_sentiment" => $remedy_sentiment
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>