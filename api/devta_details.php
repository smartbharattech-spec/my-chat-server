<?php
require_once 'config.php';

header('Content-Type: application/json');

// GET: Fetch devta details (optional filter by name or all_status)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $devta_name = $_GET['name'] ?? null;
    $include_drafts = isset($_GET['all_status']) && $_GET['all_status'] === 'true';

    try {
        if ($devta_name) {
            $sql = "SELECT * FROM devta_details WHERE devta_name = :name";
            if (!$include_drafts) {
                $sql .= " AND status = 'active'";
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':name' => $devta_name]);
        } else {
            $sql = "SELECT * FROM devta_details";
            if (!$include_drafts) {
                $sql .= " WHERE status = 'active'";
            }
            $sql .= " ORDER BY id ASC";
            $stmt = $pdo->query($sql);
        }
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}
?>