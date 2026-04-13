<?php
header('Content-Type: text/plain');
require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT e.user_id, m.name 
        FROM expert_profiles e
        JOIN marketplace_users m ON e.user_id = m.id
        WHERE e.slug IS NULL OR e.slug = ''
    ");
    $experts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($experts) . " experts without slugs.\n";

    foreach ($experts as $expert) {
        $name = $expert['name'];
        $userId = $expert['user_id'];
        
        $baseSlug = strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $name));
        $slug = $baseSlug;
        
        // De-duplicate slug
        $check = $pdo->prepare("SELECT user_id FROM expert_profiles WHERE slug = ? AND user_id != ?");
        $check->execute([$slug, $userId]);
        if ($check->fetch()) {
            $slug = $baseSlug . '-' . rand(100, 999);
        }

        $update = $pdo->prepare("UPDATE expert_profiles SET slug = ? WHERE user_id = ?");
        $update->execute([$slug, $userId]);
        
        echo "Updated Expert ID $userId ($name) -> Slug: $slug\n";
    }

    echo "Migration finished.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
