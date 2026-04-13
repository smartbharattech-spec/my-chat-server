<?php
require_once 'config.php';

try {
    // 1. Create Table
    $sql = "CREATE TABLE IF NOT EXISTS entrance_remedies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        zone_code VARCHAR(10) NOT NULL UNIQUE,
        is_positive BOOLEAN DEFAULT FALSE,
        remedy TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);
    echo "Table 'entrance_remedies' created or exists.\n";

    // 2. Define 32 Zones
    $zones = [
        // North
        'N1',
        'N2',
        'N3',
        'N4',
        'N5',
        'N6',
        'N7',
        'N8',
        // East
        'E1',
        'E2',
        'E3',
        'E4',
        'E5',
        'E6',
        'E7',
        'E8',
        // South
        'S1',
        'S2',
        'S3',
        'S4',
        'S5',
        'S6',
        'S7',
        'S8',
        // West
        'W1',
        'W2',
        'W3',
        'W4',
        'W5',
        'W6',
        'W7',
        'W8'
    ];

    // 3. Seed Data
    $stmt = $pdo->prepare("INSERT IGNORE INTO entrance_remedies (zone_code, is_positive, remedy) VALUES (:zone, :pos, :rem)");

    foreach ($zones as $zone) {
        // Default logic: Usually N3, N4, E3, E4, S3, S4, W3, W4 are considered positive in some texts, 
        // but often varies. Let's strictly mark N3, N4, E3, E4, S3, S4, W3, W4 as Postive (1) for seed, others Negative (0).
        // User can change this in Admin Panel.

        $isPositive = 0;
        // Simple heuristic for seeding (User will edit this)
        if (in_array($zone, ['N3', 'N4', 'E3', 'E4', 'S3', 'S4', 'W3', 'W4'])) {
            $isPositive = 1;
        }

        $stmt->execute([
            ':zone' => $zone,
            ':pos' => $isPositive,
            ':rem' => $isPositive ? "Good Entrance. No remedy needed." : "Consult a Vastu Expert."
        ]);
    }

    echo "Seeding completed.\n";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}
?>