<?php
require_once 'config.php';

try {
    // Create remedy_categories table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS remedy_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'MeetingRoomIcon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Seed initial categories if table is empty
    $check = $pdo->query("SELECT COUNT(*) FROM remedy_categories")->fetchColumn();
    if ($check == 0) {
        $initial = [
            ['Entrance', 'MeetingRoomIcon'],
            ['Kitchen', 'KitchenIcon'],
            ['Toilet', 'WcIcon'],
            ['Mandir', 'TempleHinduIcon'],
            ['Master Bed', 'MeetingRoomIcon'],
            ['Kids Bed', 'MeetingRoomIcon'],
            ['Study Table', 'AssignmentIndIcon'],
            ['Locker', 'PaymentIcon']
        ];
        $stmt = $pdo->prepare("INSERT INTO remedy_categories (name, icon) VALUES (?, ?)");
        foreach ($initial as $cat) {
            $stmt->execute($cat);
        }
    }

    echo json_encode(["status" => "success", "message" => "Database setup complete"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
