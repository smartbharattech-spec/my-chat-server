<?php
$host = 'localhost';
$db = 'myvastutool';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Vastu Rules Map (Category => [Positive Zones])
    // Note: 32 zones simplified to their 16-zone equivalent labels if needed, or exact 32-zone codes.
    // I'll use common 32-zone positive ranges.
    $rules = [
        "Entrance" => ["N3", "N4", "E3", "E4", "S3", "S4", "W3", "W4"],
        "Kitchen" => ["S7", "S8", "E1", "E2", "W5", "W6"], // SE and NW ranges
        "Toilet" => ["S4", "S5", "W1", "W2", "E7", "E8"], // SSW, WNW, ESE ranges
        "Mandir" => ["N1", "N2", "E3", "E4", "N8"], // NE and East ranges
        "Master Bed" => ["S1", "S2", "S3", "W7", "W8"], // SW and South ranges
        "Kids Bed" => ["N5", "N6", "E5", "E6", "W1", "W2"], // NW and East ranges
        "W. Machine" => ["W1", "W2", "S4", "S5", "E7", "E8"],
        "Locker" => ["N3", "N4", "N5"], // North (Kuber)
        "Study Table" => ["W3", "W4", "E3", "E4", "NE"],
        "Dining" => ["W5", "W6", "E5", "E6", "S3", "S4"],
        "Office Desk" => ["N3", "N4", "W3", "W4"],
        "Fam. Photo" => ["S1", "S2", "E3", "E4"], // SW for strength
        "Trophies" => ["N3", "N4", "E3", "E4"],
        "O.H. Tank" => ["W7", "W8", "S1", "S2"], // SW for weight
        "U.G. Tank" => ["N3", "N4", "E3", "E4"], // North/East for water
        "Septic Tank" => ["S4", "S5", "W1", "W2"], // SSW/WNW
        "Dustbin" => ["S4", "S5", "W1", "W2", "E7", "E8"],
        "Staircase Area" => ["S1", "S2", "W7", "W8", "S3", "S4"], // heavy in SW/S/W
        "Staircase Landing" => ["S1", "S2", "W7", "W8"]
    ];

    $zones = [
        'N1',
        'N2',
        'N3',
        'N4',
        'N5',
        'N6',
        'N7',
        'N8',
        'E1',
        'E2',
        'E3',
        'E4',
        'E5',
        'E6',
        'E7',
        'E8',
        'S1',
        'S2',
        'S3',
        'S4',
        'S5',
        'S6',
        'S7',
        'S8',
        'W1',
        'W2',
        'W3',
        'W4',
        'W5',
        'W6',
        'W7',
        'W8'
    ];

    $stmt = $pdo->prepare("INSERT INTO entrance_remedies (category, zone_code, is_positive, remedy) 
                           VALUES (:cat, :zone, :pos, :rem) 
                           ON DUPLICATE KEY UPDATE is_positive = :pos2, remedy = :rem2");

    foreach ($rules as $cat => $posZones) {
        foreach ($zones as $zone) {
            $isPos = in_array($zone, $posZones) ? 1 : 0;
            $rem = $isPos ? "This is a favorable placement." : "Placement in $zone is not ideal. Apply standard Vastu remedy.";

            $stmt->execute([
                ':cat' => $cat,
                ':zone' => $zone,
                ':pos' => $isPos,
                ':rem' => $rem,
                ':pos2' => $isPos,
                ':rem2' => $rem
            ]);
        }
    }

    echo "Successfully updated Vastu database with 19 categories and expert rules.";

} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>