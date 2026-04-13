<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch map requests (Admin or User)
        // If email is provided, fetch for that user, otherwise fetch all (for admin)
        $email = $_GET['email'] ?? null;

        try {
            if ($email) {
                $stmt = $pdo->prepare("SELECT * FROM map_requests WHERE user_email = :email ORDER BY created_at DESC");
                $stmt->execute(['email' => $email]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM map_requests ORDER BY created_at DESC");
                $stmt->execute();
            }
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $requests]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Create new map request
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['user_email']) || empty($data['user_name'])) {
            echo json_encode(["status" => "error", "message" => "Required fields missing"]);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO map_requests (user_email, user_name, whatsapp_number, project_name, requirements, contact_number, city, state) VALUES (:user_email, :user_name, :whatsapp_number, :project_name, :requirements, :contact_number, :city, :state)");
            $stmt->execute([
                'user_email' => $data['user_email'],
                'user_name' => $data['user_name'],
                'whatsapp_number' => $data['whatsapp_number'] ?? null,
                'project_name' => $data['project_name'] ?? null,
                'requirements' => $data['requirements'] ?? null,
                'contact_number' => $data['contact_number'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null
            ]);
            echo json_encode(["status" => "success", "message" => "Request submitted successfully", "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Update request status and upload map (Admin)
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['id'])) {
            echo json_encode(["status" => "error", "message" => "ID is required"]);
            break;
        }

        $id = $data['id'];
        $fields = [];
        $params = ['id' => $id];

        if (isset($data['status'])) {
            $fields[] = "status = :status";
            $params['status'] = $data['status'];
        }

        if (isset($data['created_map']) && strpos($data['created_map'], 'data:image') === 0) {
            $base64_string = $data['created_map'];
            if (preg_match('/^data:image\/(\w+);base64,/', $base64_string, $type)) {
                $image_data = substr($base64_string, strpos($base64_string, ',') + 1);
                $image_data = base64_decode($image_data);
                $extension = strtolower($type[1]);

                if ($image_data) {
                    $filename = "created_map_" . $id . "_" . time() . "." . $extension;
                    $upload_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'maps' . DIRECTORY_SEPARATOR;

                    if (!is_dir($upload_dir)) {
                        mkdir($upload_dir, 0777, true);
                    }

                    if (file_put_contents($upload_dir . $filename, $image_data)) {
                        $fields[] = "created_map = :created_map";
                        $params['created_map'] = $filename;

                        // Also set status to completed if a map is uploaded
                        if (!isset($data['status'])) {
                            $fields[] = "status = 'completed'";
                        }
                    }
                }
            }
        }

        if (empty($fields)) {
            echo json_encode(["status" => "error", "message" => "No fields to update"]);
            break;
        }

        try {
            $sql = "UPDATE map_requests SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(["status" => "success", "message" => "Update successful"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete request
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? ($_GET['id'] ?? null);

        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "ID is required"]);
            break;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM map_requests WHERE id = :id");
            $stmt->execute(['id' => $id]);
            echo json_encode(["status" => "success", "message" => "Request deleted successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
        break;
}
?>