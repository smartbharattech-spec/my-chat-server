<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Ensure uploads directory exists
$upload_dir = 'uploads/tutorials/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM tutorials ORDER BY created_at DESC");
        $tutorials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $tutorials]);
        break;

    case 'POST':
        // Handle tutorial creation/update
        $title = $_POST['title'] ?? '';
        $description = $_POST['description'] ?? '';
        $video_url = $_POST['video_url'] ?? '';
        $tool_name = $_POST['tool_name'] ?? '';
        $id = $_POST['id'] ?? null;
        $video_filename = null;

        if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION);
            $video_filename = preg_replace("/[^a-zA-Z0-9]/", "_", $title) . "_" . time() . "." . $ext;
            move_uploaded_file($_FILES['video']['tmp_name'], $upload_dir . $video_filename);
        }

        if ($id) {
            // Update
            $sql = "UPDATE tutorials SET title = ?, description = ?, video_url = ?, tool_name = ?" . ($video_filename ? ", video_filename = ?" : "") . " WHERE id = ?";
            $params = [$title, $description, $video_url, $tool_name];
            if ($video_filename)
                $params[] = $video_filename;
            $params[] = $id;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(["status" => "success", "message" => "Tutorial updated"]);
        } else {
            // Create
            $stmt = $pdo->prepare("INSERT INTO tutorials (title, description, video_url, tool_name, video_filename) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $video_url, $tool_name, $video_filename]);
            echo json_encode(["status" => "success", "message" => "Tutorial created"]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        if ($id) {
            // Delete file if exists
            $stmt = $pdo->prepare("SELECT video_filename FROM tutorials WHERE id = ?");
            $stmt->execute([$id]);
            $tut = $stmt->fetch();
            if ($tut && $tut['video_filename'] && file_exists($upload_dir . $tut['video_filename'])) {
                unlink($upload_dir . $tut['video_filename']);
            }

            $stmt = $pdo->prepare("DELETE FROM tutorials WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Tutorial deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Missing ID"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
        break;
}
?>