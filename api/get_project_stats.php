<?php
require_once 'config.php';

header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

function get_zone_label($index, $zones)
{
    $zones8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    $zones16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    $zones32 = [
        "N5",
        "N6",
        "N7",
        "N8",
        "E1",
        "E2",
        "E3",
        "E4",
        "E5",
        "E6",
        "E7",
        "E8",
        "S1",
        "S2",
        "S3",
        "S4",
        "S5",
        "S6",
        "S7",
        "S8",
        "W1",
        "W2",
        "W3",
        "W4",
        "W5",
        "W6",
        "W7",
        "W8",
        "N1",
        "N2",
        "N3",
        "N4"
    ];
    if ($zones == 8)
        return $zones8[$index % 8];
    if ($zones == 16)
        return $zones16[$index % 16];
    if ($zones == 32)
        return $zones32[$index % 32];
    return "";
}

function calculate_zone($entrance, $center, $rotation, $zones)
{
    if (!$entrance || !$center)
        return null;
    $midX = 0;
    $midY = 0;
    if (isset($entrance['points']) && count($entrance['points']) > 0) {
        $sumX = 0;
        $sumY = 0;
        foreach ($entrance['points'] as $p) {
            $sumX += $p['x'];
            $sumY += $p['y'];
        }
        $midX = $sumX / count($entrance['points']);
        $midY = $sumY / count($entrance['points']);
    } elseif (isset($entrance['start']) && isset($entrance['end'])) {
        $midX = ($entrance['start']['x'] + $entrance['end']['x']) / 2;
        $midY = ($entrance['start']['y'] + $entrance['end']['y']) / 2;
    } else {
        return null;
    }
    $dx = $midX - $center['x'];
    $dy = $center['y'] - $midY;
    $mathDeg = atan2($dy, $dx) * 180 / M_PI;
    if ($mathDeg < 0)
        $mathDeg += 360;
    $vastuDeg = fmod((450 - $mathDeg), 360);
    $correctedAngle = fmod(($vastuDeg - ($rotation ?? 0) + 360), 360);
    $step = 360 / $zones;
    $offset = ($zones == 32) ? 0 : ($step / 2);
    $index = floor(fmod(($correctedAngle + $offset), 360) / $step);
    return get_zone_label($index, $zones);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT id, project_name, email, project_data FROM projects");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalProjects = count($results);
        $projectsWithVastuItems = 0;
        $categoryCounts = [];
        $entrancesAll = [];

        foreach ($results as $row) {
            $data = json_decode($row['project_data'], true);
            if ($data && isset($data['entrances']) && is_array($data['entrances']) && count($data['entrances']) > 0) {
                $projectsWithVastuItems++;

                $center = $data['center'] ?? null;
                $rotation = $data['shakti']['rotation'] ?? 0;

                foreach ($data['entrances'] as $item) {
                    $cat = $item['category'] ?? 'Entrance';
                    if (!isset($categoryCounts[$cat])) {
                        $categoryCounts[$cat] = 0;
                    }
                    $categoryCounts[$cat]++;

                    if ($center) {
                        $entrancesAll[] = [
                            "project_id" => $row['id'],
                            "project_name" => $row['project_name'],
                            "email" => $row['email'],
                            "category" => $cat,
                            "z8" => calculate_zone($item, $center, $rotation, 8),
                            "z16" => calculate_zone($item, $center, $rotation, 16),
                            "z32" => calculate_zone($item, $center, $rotation, 32)
                        ];
                    }
                }
            }
        }

        echo json_encode([
            "status" => "success",
            "total_projects" => $totalProjects,
            "projects_with_vastu" => $projectsWithVastuItems,
            "category_counts" => $categoryCounts,
            "entrances_all" => $entrancesAll
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>