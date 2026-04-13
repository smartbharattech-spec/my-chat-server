<?php
require_once 'config.php';

header('Content-Type: application/json');

// GET: Fetch remedies (optional filter by category and expert)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? 'Entrance';
    $expert_id = isset($_GET['expert_id']) ? (int)$_GET['expert_id'] : null;
    $include_drafts = isset($_GET['all_status']) && $_GET['all_status'] === 'true';

    try {
        if ($category === 'all') {
            // For 'all', we want to get system defaults (expert_id IS NULL) 
            // OR the expert's custom ones if provided.
            // If expert_id is provided, we merge: Expert's own > System Defaults.
            if ($expert_id) {
                // Logic: Select expert's remedies, then select system ones for categories/zones NOT in expert's list.
                // Simpler for now: Fetch all for this expert, and all where expert_id is NULL.
                // Frontend/Client will handle the "override" logic or we can do it here with a UNION or JOIN.
                $sql = "SELECT er.*, mu.name as expert_name 
                        FROM entrance_remedies er 
                        LEFT JOIN marketplace_users mu ON er.expert_id = mu.id 
                        WHERE (er.expert_id = :expert OR er.expert_id IS NULL)";
                if (!$include_drafts) $sql .= " AND er.status = 'active'";
                $sql .= " ORDER BY er.category, er.zone_code, er.expert_id DESC"; 
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':expert' => $expert_id]);
                
                $rawData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $finalData = [];
                // Deduplicate: Keep expert's version if both exist for same category + zone
                foreach ($rawData as $row) {
                    $key = $row['category'] . '_' . $row['zone_code'];
                    if (!isset($finalData[$key])) {
                        $finalData[$key] = $row;
                    }
                }
                $data = array_values($finalData);
            } else {
                $sql = "SELECT er.*, mu.name as expert_name 
                        FROM entrance_remedies er 
                        LEFT JOIN marketplace_users mu ON er.expert_id = mu.id 
                        WHERE er.expert_id IS NULL";
                if (!$include_drafts) $sql .= " AND er.status = 'active'";
                $sql .= " ORDER BY er.category, er.id ASC";
                $stmt = $pdo->query($sql);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        } else {
            if ($expert_id) {
                $sql = "SELECT er.*, mu.name as expert_name 
                        FROM entrance_remedies er 
                        LEFT JOIN marketplace_users mu ON er.expert_id = mu.id 
                        WHERE er.category = :cat AND (er.expert_id = :expert OR er.expert_id IS NULL)";
                if (!$include_drafts) $sql .= " AND er.status = 'active'";
                $sql .= " ORDER BY er.zone_code, er.expert_id DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':cat' => $category, ':expert' => $expert_id]);
                
                $rawData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $finalData = [];
                foreach ($rawData as $row) {
                    $key = $row['zone_code'];
                    if (!isset($finalData[$key])) {
                        $finalData[$key] = $row;
                    }
                }
                $data = array_values($finalData);
            } else {
                $sql = "SELECT er.*, mu.name as expert_name 
                        FROM entrance_remedies er 
                        LEFT JOIN marketplace_users mu ON er.expert_id = mu.id 
                        WHERE er.category = :cat AND er.expert_id IS NULL";
                if (!$include_drafts) $sql .= " AND er.status = 'active'";
                $sql .= " ORDER BY er.id ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':cat' => $category]);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// POST: Update or Create specific remedy
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? null;
    $expert_id = $_POST['expert_id'] ?? null;
    $category = $_POST['category'] ?? null;
    $zone_code = $_POST['zone_code'] ?? null;
    $is_positive = $_POST['is_positive'] ?? null;
    $remedy = $_POST['remedy'] ?? null;
    $product_ids = $_POST['product_ids'] ?? null;
    $status = $_POST['status'] ?? 'active';

    if (!$id) {
        $json = json_decode(file_get_contents("php://input"), true);
        if ($json) {
            $id = $json['id'] ?? null;
            $expert_id = $json['expert_id'] ?? null;
            $category = $json['category'] ?? null;
            $zone_code = $json['zone_code'] ?? null;
            $is_positive = $json['is_positive'] ?? null;
            $remedy = $json['remedy'] ?? null;
            $product_ids = $json['product_ids'] ?? null;
            $status = $json['status'] ?? 'active';
        }
    }

    try {
        if ($id) {
            // Update existing
            $sql = "UPDATE entrance_remedies SET is_positive = :pos, remedy = :rem, product_ids = :prod, status = :status WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':pos' => $is_positive, ':rem' => $remedy, ':prod' => $product_ids, ':status' => $status, ':id' => $id]);
            echo json_encode(['status' => 'success', 'message' => 'Remedy updated successfully']);
        } elseif ($expert_id && $category && $zone_code) {
            // Check if already exists for this expert/category/zone
            $check = $pdo->prepare("SELECT id FROM entrance_remedies WHERE expert_id = ? AND category = ? AND zone_code = ?");
            $check->execute([$expert_id, $category, $zone_code]);
            $existing = $check->fetch();

            if ($existing) {
                $sql = "UPDATE entrance_remedies SET is_positive = :pos, remedy = :rem, product_ids = :prod, status = :status WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':pos' => $is_positive, ':rem' => $remedy, ':prod' => $product_ids, ':status' => $status, ':id' => $existing['id']]);
            } else {
                $sql = "INSERT INTO entrance_remedies (expert_id, category, zone_code, is_positive, remedy, product_ids, status) VALUES (:expert, :cat, :zone, :pos, :rem, :prod, :status)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':expert' => $expert_id, ':cat' => $category, ':zone' => $zone_code, ':pos' => $is_positive, ':rem' => $remedy, ':prod' => $product_ids, ':status' => $status]);
            }
            echo json_encode(['status' => 'success', 'message' => 'Expert remedy saved successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Missing required fields (id or expert_id+category+zone)']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}
?>