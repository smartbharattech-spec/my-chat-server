<?php
require_once 'config.php';

header('Content-Type: application/json');

// POST: Manage devta details (Add/Update/Delete - Admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = json_decode(file_get_contents("php://input"), true);
    if (!$json) {
        $json = $_POST;
    }

    $action = $json['action'] ?? 'update';
    $id = $json['id'] ?? null;
    $devta_name = $json['devta_name'] ?? null;
    $hawan = $json['hawan'] ?? null;
    $bhog = $json['bhog'] ?? null;
    $attributes = $json['attributes'] ?? null;
    $status = $json['status'] ?? 'active';

    if ($action === 'add') {
        if (!$devta_name) {
            echo json_encode(['status' => 'error', 'message' => 'Devta name is required']);
            exit;
        }
        try {
            $sql = "INSERT INTO devta_details (devta_name, hawan, bhog, attributes, status) 
                    VALUES (:name, :hawan, :bhog, :attr, :status)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $devta_name,
                ':hawan' => $hawan,
                ':bhog' => $bhog,
                ':attr' => $attributes,
                ':status' => $status
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Devta details added successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'update') {
        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'Missing ID for update']);
            exit;
        }
        try {
            $sql = "UPDATE devta_details SET hawan = :hawan, bhog = :bhog, attributes = :attr, status = :status WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':hawan' => $hawan,
                ':bhog' => $bhog,
                ':attr' => $attributes,
                ':status' => $status,
                ':id' => $id
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Devta details updated successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'delete') {
        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'Missing ID for delete']);
            exit;
        }
        try {
            $sql = "DELETE FROM devta_details WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            echo json_encode(['status' => 'success', 'message' => 'Devta details deleted successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit;
}
?>