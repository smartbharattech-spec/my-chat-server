<?php
require_once 'config.php';

header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

function get_zone_label($index, $zones)
{
    $zones8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    $zones16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    $zones32 = ["N5", "N6", "N7", "N8", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "N1", "N2", "N3", "N4"];
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
        // Pagination Parameters
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Filter Parameters
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
        $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';
        $status = isset($_GET['status']) ? $_GET['status'] : 'all';
        $constructionType = isset($_GET['construction_type']) ? $_GET['construction_type'] : 'all';
        $userEmail = isset($_GET['user_email']) ? trim($_GET['user_email']) : 'all';

        // Vastu Filters
        $vastuCategory = isset($_GET['vastu_category']) ? $_GET['vastu_category'] : 'all';
        $vastuZone = isset($_GET['vastu_zone']) ? $_GET['vastu_zone'] : 'all';
        $zoneType = isset($_GET['zone_type']) ? (int) $_GET['zone_type'] : 16;
        $projectIssue = isset($_GET['project_issue']) ? $_GET['project_issue'] : 'all';

        // Build Query Conditions
        $conditions = [];
        $params = [];

        if (!empty($search)) {
            $conditions[] = "(p.project_name LIKE :search OR p.email LIKE :search OR p.plan_name LIKE :search OR p.project_issue LIKE :search OR u.firstname LIKE :search)";
            $params[':search'] = "%$search%";
        }

        if ($projectIssue !== 'all') {
            if ($projectIssue === 'Custom') {
                // Show items that are NOT just standard issues
                // This simplistically excludes rows that ONLY contain standard keywords
                // It might not be perfect but covers most "Custom only" or "Custom + Standard" cases if we define it right.
                // For now, let's keep it simple: Show if it doesn't match standard keywords exactly? 
                // No, that's too hard. Let's just search for NOT LIKE standard ones? No.
                // Let's fallback to the user's previous logic notion: Custom meant "None of the above" or "Special".
                // Since we now mix them, "Custom" filter is ambiguous. 
                // Let's just say "Custom" means it doesn't contain Health, Wealth OR Relationship? No, that excludes "Health, MyCustom".

                // Better logic: Filter where project_issue IS NOT NULL AND project_issue != ''
                // AND (project_issue NOT LIKE '%Health%' AND project_issue NOT LIKE '%Wealth%' AND project_issue NOT LIKE '%Relationship%')
                // This finds "Only Custom".

                $conditions[] = "(project_issue NOT LIKE '%Health%' AND project_issue NOT LIKE '%Wealth%' AND project_issue NOT LIKE '%Relationship%' AND project_issue IS NOT NULL AND project_issue != '')";
            } else {
                $conditions[] = "project_issue LIKE :projectIssue";
                $params[':projectIssue'] = "%$projectIssue%";
            }
        }

        if (!empty($startDate)) {
            $conditions[] = "DATE(created_at) >= :startDate";
            $params[':startDate'] = $startDate;
        }

        if (!empty($endDate)) {
            $conditions[] = "DATE(created_at) <= :endDate";
            $params[':endDate'] = $endDate;
        }

        if ($status === 'Paid') {
            $conditions[] = "(plan_id IS NOT NULL AND plan_id != '')";
        } elseif ($status === 'Unpaid') {
            $conditions[] = "(plan_id IS NULL OR plan_id = '')";
        }

        if ($constructionType !== 'all') {
            $conditions[] = "p.construction_type = :constructionType";
            $params[':constructionType'] = $constructionType;
        }

        if ($userEmail !== 'all') {
            $conditions[] = "p.email = :userEmail";
            $params[':userEmail'] = $userEmail;
        }

        $whereClause = "";
        if (count($conditions) > 0) {
            $whereClause = "WHERE " . implode(" AND ", $conditions);
        }

        // Fetch all candidates to filter by Vastu
        $allSql = "SELECT p.id, p.project_data FROM projects p LEFT JOIN users u ON p.email = u.email $whereClause ORDER BY p.created_at DESC";
        $allStmt = $pdo->prepare($allSql);
        $allStmt->execute($params);
        $candidates = $allStmt->fetchAll(PDO::FETCH_ASSOC);

        $filteredIds = [];
        foreach ($candidates as $row) {
            if ($vastuCategory === 'all' && $vastuZone === 'all') {
                $filteredIds[] = $row['id'];
                continue;
            }

            $data = json_decode($row['project_data'], true);
            if (!$data || !isset($data['entrances']) || !is_array($data['entrances']))
                continue;

            $matchFound = false;
            $center = $data['center'] ?? null;
            $rotation = $data['shakti']['rotation'] ?? 0;

            foreach ($data['entrances'] as $item) {
                $cat = $item['category'] ?? 'Entrance';
                $passCat = ($vastuCategory === 'all' || $cat === $vastuCategory);

                $itemZone = ($vastuZone === 'all') ? 'all' : calculate_zone($item, $center, $rotation, $zoneType);
                $passZone = ($vastuZone === 'all' || $itemZone === $vastuZone);

                if ($passCat && $passZone) {
                    $matchFound = true;
                    break;
                }
            }

            if ($matchFound) {
                $filteredIds[] = $row['id'];
            }
        }

        $totalProjects = count($filteredIds);

        if ($totalProjects === 0) {
            echo json_encode([
                "status" => "success",
                "data" => [],
                "total" => 0,
                "page" => $page,
                "limit" => $limit,
                "total_pages" => 0
            ]);
            exit;
        }

        // Now fetch specific projects from paginated IDs
        $paginatedIds = array_slice($filteredIds, $offset, $limit);
        $placeholders = implode(',', array_fill(0, count($paginatedIds), '?'));

        $sql = "SELECT p.id, p.email, p.project_name, p.construction_type, p.property_type, p.project_issue, p.plan_name, p.plan_id, p.created_at, p.updated_at, u.firstname as user_name
                FROM projects p 
                LEFT JOIN users u ON p.email = u.email 
                WHERE p.id IN ($placeholders)
                ORDER BY p.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($paginatedIds);

        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($projects as &$p) {
            $p['payment_status'] = (!empty($p['plan_id'])) ? 'Paid' : 'Unpaid';
        }

        echo json_encode([
            "status" => "success",
            "data" => $projects,
            "total" => $totalProjects,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => ceil($totalProjects / $limit)
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