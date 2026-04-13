<?php
require_once "config.php";
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data["action"] ?? "";

    if ($action === "delete") {
        $id = $data["id"] ?? 0;
        try {
            $stmt = $pdo->prepare("DELETE FROM entrance_remedies WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Remedy deleted successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === "add") {
       $category = $data["category"] ?? "Entrance";
       $zone = $data["zone_code"] ?? "";
       $is_positive = $data["is_positive"] ?? 0;
       $remedy = $data["remedy"] ?? "";
       $product_id = $data["product_ids"] ?? null;
       $status = $data["status"] ?? "active";

       if (!$category || !$zone) {
           echo json_encode(["status" => "error", "message" => "Zone and Category are required"]);
           exit;
       }

       try {
           $stmt = $pdo->prepare("INSERT INTO entrance_remedies (category, zone_code, is_positive, remedy, product_ids, status) VALUES (?, ?, ?, ?, ?, ?)");
           $stmt->execute([$category, $zone, $is_positive, $remedy, $product_id, $status]);
           echo json_encode(["status" => "success", "message" => "Remedy added successfully"]);
       } catch (PDOException $e) {
           echo json_encode(["status" => "error", "message" => $e->getMessage()]);
       }
    }
}
?>
