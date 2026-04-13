<?php
require_once 'api/config.php';
try {
    $stmt = $pdo->query("SELECT * FROM community_posts ORDER BY id DESC LIMIT 5");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($posts);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
