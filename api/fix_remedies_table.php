<?php
require_once 'config.php';

try {
    // 1. Drop the restrictive old unique index
    try {
        $pdo->exec("ALTER TABLE entrance_remedies DROP INDEX idx_category_zone");
        echo "Dropped idx_category_zone\n";
    } catch (Exception $e) {}

    try {
        $pdo->exec("ALTER TABLE entrance_remedies DROP INDEX zone_code");
        echo "Dropped zone_code\n";
    } catch (Exception $e) {}

    // 2. Add expert_id if missing
    $pdo->exec("ALTER TABLE entrance_remedies ADD COLUMN IF NOT EXISTS expert_id INT DEFAULT NULL AFTER id");
    
    // 3. Add category if missing
    $pdo->exec("ALTER TABLE entrance_remedies ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Entrance' AFTER expert_id");
    
    // 4. Add product_ids if missing
    $pdo->exec("ALTER TABLE entrance_remedies ADD COLUMN IF NOT EXISTS product_ids TEXT DEFAULT NULL AFTER remedy");
    
    // 5. Add status if missing
    $pdo->exec("ALTER TABLE entrance_remedies ADD COLUMN IF NOT EXISTS status ENUM('active', 'draft') DEFAULT 'active' AFTER product_ids");

    // 6. Create the correct UNIQUE index for experts
    // This allows different experts to have their own remedy for the same category/zone
    try {
        $pdo->exec("CREATE UNIQUE INDEX unique_expert_remedy ON entrance_remedies (expert_id, category, zone_code)");
        echo "Created unique_expert_remedy index\n";
    } catch (Exception $e) {
        // If it already exists, that's fine
    }

    echo json_encode(["status" => "success", "message" => "Table entrance_remedies indexes fixed"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
