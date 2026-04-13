<?php
// migrate_reviews.php
// Visit this file in your browser after uploading to the live server root.

// 1. Enable Error Reporting to find the cause of 500 error
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<html><body style='font-family: sans-serif; padding: 20px; line-height: 1.6;'>";
echo "<h2 style='color: #431407;'>MyVastuTool - Database Migration (Debug Mode)</h2>";

// 2. Check if config exists
$configPath = 'api/config.php';
if (!file_exists($configPath)) {
    die("<p style='color: red;'><b>Error:</b> '$configPath' not found. Please ensure you uploaded the 'api' folder to the same directory as this file.</p></body></html>");
}

echo "<p style='color: blue;'>Config found. Connecting to database...</p>";

try {
    define('NO_JSON_HEADER', true); // Stop config.php from sending JSON header
    require_once $configPath;

    if (!isset($pdo)) {
        die("<p style='color: red;'><b>Error:</b> Database connection variable (\$pdo) not found in config.php.</p></body></html>");
    }

    $tables = $pdo->query("SHOW TABLES LIKE 'reviews'")->fetchAll();
    if (empty($tables)) {
        die("<p style='color: red;'><b>Error:</b> 'reviews' table not found in your database. Please check your DB_NAME in api/config.php.</p></body></html>");
    }

    $changes = [
        'remedy_name' => "VARCHAR(255) DEFAULT 'General' AFTER comment",
        'profit_impact' => "VARCHAR(255) DEFAULT '' AFTER remedy_name",
        'sentiment' => "VARCHAR(255) DEFAULT 'Positive' AFTER profit_impact"
    ];

    echo "<h3>Applying Changes:</h3><ul>";
    foreach ($changes as $column => $definition) {
        $stmt = $pdo->query("SHOW COLUMNS FROM reviews LIKE '$column'");
        if (!$stmt->fetch()) {
            try {
                $pdo->exec("ALTER TABLE reviews ADD COLUMN $column $definition");
                echo "<li style='color: green;'>Success: Column <b>$column</b> added.</li>";
            } catch (Exception $alterEx) {
                echo "<li style='color: red;'>Failed to add $column: " . htmlspecialchars($alterEx->getMessage()) . "</li>";
            }
        } else {
            echo "<li style='color: orange;'>Info: Column <b>$column</b> already exists.</li>";
        }
    }
    echo "</ul>";

    echo "<p style='padding: 10px; background: #f0fdf4; border: 1px solid #16a34a; color: #16a34a; border-radius: 8px;'>";
    echo "<b>Migration Complete!</b> Database is now updated. You can delete this file from your server.";
    echo "</p>";

} catch (Exception $e) {
    echo "<p style='color: red; padding: 10px; background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px;'>";
    echo "<b>Database or Script Error:</b> " . htmlspecialchars($e->getMessage());
    echo "</p>";
}

echo "</body></html>";
?>