<?php
require_once 'api/config.php';

$slug = 'rohit-781';

try {
    $stmt = $pdo->prepare("
        SELECT m.id, m.name, m.status, e.slug, e.is_live
        FROM marketplace_users m
        JOIN expert_profiles e ON m.id = e.user_id
        WHERE e.slug = ?
    ");
    $stmt->execute([$slug]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo "FOUND: " . json_encode($result);
    } else {
        echo "NOT FOUND IN DB for slug: " . $slug;
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
