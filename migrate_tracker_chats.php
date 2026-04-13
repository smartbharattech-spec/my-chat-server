<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "myvastutool";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create tracker_chats table
$sql = "CREATE TABLE IF NOT EXISTS tracker_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    sender_role ENUM('user', 'expert') NOT NULL,
    message TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES tracker_submissions(id) ON DELETE CASCADE
)";

if ($conn->query($sql) === TRUE) {
    echo "Table tracker_chats created successfully\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

// Migrate existing data if any (optional, but good for consistency)
// Move experience/user_image to tracker_chats as 'user' sender
$sql_migrate_user = "INSERT INTO tracker_chats (submission_id, sender_role, message, image, created_at)
SELECT id, 'user', experience, user_image, created_at FROM tracker_submissions WHERE experience IS NOT NULL AND experience != ''";

if ($conn->query($sql_migrate_user) === TRUE) {
    echo "Migrated user experiences to chats\n";
}

// Move admin_note/expert_image to tracker_chats as 'expert' sender
$sql_migrate_expert = "INSERT INTO tracker_chats (submission_id, sender_role, message, image, created_at)
SELECT id, 'expert', admin_note, expert_image, created_at FROM tracker_submissions WHERE admin_note IS NOT NULL AND admin_note != ''";

if ($conn->query($sql_migrate_expert) === TRUE) {
    echo "Migrated expert notes to chats\n";
}

$conn->close();
?>
