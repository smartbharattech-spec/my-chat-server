<?php
// Database Installer for Occult Marketplace
require_once __DIR__ . '/../config.php';

try {
    // Read the SQL file
    $sqlFile = __DIR__ . '/marketplace_db.sql';
    if (!file_exists($sqlFile)) {
        die(json_encode(["status" => "error", "message" => "SQL file not found!"]));
    }

    $sql = file_get_contents($sqlFile);

    // Split SQL into individual queries to handle multiple statements in PDO exec
    $queries = explode(';', $sql);
    foreach ($queries as $query) {
        $query = trim($query);
        if ($query) {
            $pdo->exec($query);
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Database tables created successfully! You can now register."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Installation failed: " . $e->getMessage()
    ]);
}
