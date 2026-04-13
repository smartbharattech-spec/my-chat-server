<?php
require_once 'config.php';

try {
    // 1. Create Table
    $sql = "CREATE TABLE IF NOT EXISTS devta_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        devta_name VARCHAR(50) NOT NULL UNIQUE,
        hawan TEXT,
        bhog TEXT,
        attributes TEXT,
        status ENUM('active', 'draft') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);
    echo "Table 'devta_details' created or exists.\n";

    // 2. Define 45 Devtas
    $devtas = [
        // Center (1)
        'Brahma',
        // Inner 4 (4)
        'Bhudhar',
        'Aryama',
        'Vivasvan',
        'Mitra',
        // Middle 8 (8)
        'Aap',
        'Aapavatsa',
        'Savitra',
        'Savita',
        'Indra',
        'Indrajaya',
        'Rudra',
        'Rudrajaya',
        // Outer 32 (32)
        'Shikhi',
        'Parjanya',
        'Jayant',
        'Indra_Outer',
        'Surya',
        'Satya',
        'Bhrisha',
        'Antariksha',
        'Anila',
        'Pusha',
        'Vitatha',
        'Grihakshat',
        'Yama',
        'Gandharva',
        'Bhringraj',
        'Mriga',
        'Pitri',
        'Dauvarika',
        'Sugriva',
        'Pushpadanta',
        'Varuna',
        'Asura',
        'Sosha',
        'Papyakshman',
        'Roga',
        'Naga',
        'Mukhya',
        'Bhallat',
        'Soma',
        'Bhujang',
        'Aditi',
        'Diti'
    ];

    // 3. Seed Data
    $stmt = $pdo->prepare("INSERT IGNORE INTO devta_details (devta_name, hawan, bhog, attributes) VALUES (:name, :hawan, :bhog, :attr)");

    foreach ($devtas as $name) {
        $stmt->execute([
            ':name' => $name,
            ':hawan' => "Hawan details for $name",
            ':bhog' => "Bhog details for $name",
            ':attr' => "Attributes for $name"
        ]);
    }

    echo "Seeding completed for 45 Devtas.\n";

} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}
?>