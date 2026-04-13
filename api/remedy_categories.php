<?php
require_once 'config.php';

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS remedy_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'MeetingRoomIcon'
)");

// Seed if empty
if ($pdo->query("SELECT COUNT(*) FROM remedy_categories")->fetchColumn() == 0) {
    $initial = [['Entrance','MeetingRoomIcon'],['Kitchen','KitchenIcon'],['Toilet','WcIcon'],['Mandir','TempleHinduIcon']];
    foreach($initial as $cat) $pdo->prepare("INSERT INTO remedy_categories (name, icon) VALUES (?,?)")->execute($cat);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM remedy_categories ORDER BY id ASC");
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'] ?? '';
    if (!$name) { echo json_encode(["status" => "error", "message" => "Name required"]); exit; }
    try {
        $stmt = $pdo->prepare("INSERT INTO remedy_categories (name) VALUES (?)");
        $stmt->execute([$name]);
        echo json_encode(["status" => "success", "message" => "Category added"]);
    } catch (Exception $e) { echo json_encode(["status" => "error", "message" => "Already exists or error"]); }
}
?>
