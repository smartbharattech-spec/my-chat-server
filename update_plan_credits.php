<?php
require 'api/config.php';
try {
    $stmt = $pdo->prepare("UPDATE plans SET credits = 1 WHERE title = 'Marma & Devata Basic'");
    $stmt->execute();
    echo "Updated 'Marma & Devata Basic' to 1 credit.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>