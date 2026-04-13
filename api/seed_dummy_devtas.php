<?php
require_once 'config.php';
header('Content-Type: application/json');

$remaining = [
    "Aapavatsa" => ["Jal Dhoop", "Coconut, Curd", "Water Deity, Purification, Flow"],
    "Rudra" => ["Bhasma Dhoop", "Bael Patra, Milk", "Destruction, Transformation, Shiva"],
    "Rudrajaya" => ["Rudra Dhoop", "Wild Berries", "Victory of Rudra, Power, Strength"],
    "Indra_Outer" => ["Celestial Dhoop", "Sweet Payasam", "King of Gods, Rain, Thunder"],
    "Anila" => ["Air Dhoop", "Light Foods", "Wind, Movement, Life Force"],
];

$updated = 0;
foreach ($remaining as $name => $data) {
    $stmt = $pdo->prepare("UPDATE devta_details SET hawan = ?, bhog = ?, attributes = ?, status = 'active' WHERE devta_name = ?");
    $stmt->execute([$data[0], $data[1], $data[2], $name]);
    $updated += $stmt->rowCount();
}

echo json_encode(["status" => "success", "updated" => $updated]);
?>