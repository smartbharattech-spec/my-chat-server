<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $course = $stmt->fetch();
            
            if ($course) {
                $stmt = $pdo->prepare("SELECT * FROM course_topics WHERE course_id = ? ORDER BY sort_order ASC");
                $stmt->execute([$course['id']]);
                $topics = $stmt->fetchAll();
                
                foreach ($topics as &$topic) {
                    $stmt = $pdo->prepare("SELECT id, title, sort_order, video_url, video_filename, pdf_filename FROM course_lessons WHERE topic_id = ? ORDER BY sort_order ASC");
                    $stmt->execute([$topic['id']]);
                    $topic['lessons'] = $stmt->fetchAll();
                }
                $course['curriculum'] = $topics;
                echo json_encode(["status" => "success", "data" => $course]);
            } else {
                echo json_encode(["status" => "error", "message" => "Course not found"]);
            }
        } else {
            $expert_id = isset($_GET['expert_id']) ? $_GET['expert_id'] : null;
            if ($expert_id) {
                $stmt = $pdo->prepare("SELECT * FROM courses WHERE expert_id = ? ORDER BY created_at DESC");
                $stmt->execute([$expert_id]);
            } else {
                $stmt = $pdo->query("SELECT * FROM courses ORDER BY created_at DESC");
            }
            $courses = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $courses]);
        }
        break;

    case 'POST':
        $data = $_POST;
        
        if (isset($data['action']) && $data['action'] === 'delete') {
             $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
             $stmt->execute([$data['id']]);
             echo json_encode(["status" => "success"]);
             break;
        }

        // Handle Thumbnail Upload
        $thumbnail_path = $data['thumbnail'] ?? '';
        if (isset($_FILES['thumbnail_file']) && $_FILES['thumbnail_file']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
            
            $file_ext = pathinfo($_FILES['thumbnail_file']['name'], PATHINFO_EXTENSION);
            $file_name = 'thumb_' . time() . '_' . uniqid() . '.' . $file_ext;
            $target_file = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['thumbnail_file']['tmp_name'], $target_file)) {
                $thumbnail_path = '/api/uploads/' . $file_name;
            }
        }

        try {
            $expert_id = isset($data['expert_id']) ? (int)$data['expert_id'] : 0;
            if (isset($data['id'])) {
                $course_id = $data['id'];
                $stmt = $pdo->prepare("UPDATE courses SET title = ?, description = ?, price = ?, thumbnail = ?, status = ? WHERE id = ?");
                $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', $data['price'] ?? 0, $thumbnail_path, $data['status'] ?? 'active', $course_id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO courses (expert_id, title, description, price, thumbnail, status) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$expert_id, $data['title'] ?? '', $data['description'] ?? '', $data['price'] ?? 0, $thumbnail_path, $data['status'] ?? 'active']);
                $course_id = $pdo->lastInsertId();
            }

            if (isset($data['curriculum'])) {
                $curriculum = json_decode($data['curriculum'], true);
                if (is_array($curriculum)) {
                    $pdo->prepare("DELETE FROM course_topics WHERE course_id = ?")->execute([$course_id]);
                    foreach ($curriculum as $c_idx => $topicData) {
                        $stmt = $pdo->prepare("INSERT INTO course_topics (course_id, title, sort_order) VALUES (?, ?, ?)");
                        $stmt->execute([$course_id, $topicData['title'] ?? 'Section', $c_idx]);
                        $topic_id = $pdo->lastInsertId();
                        
                        if (isset($topicData['lessons']) && is_array($topicData['lessons'])) {
                            foreach ($topicData['lessons'] as $l_idx => $lessonData) {
                                $stmt = $pdo->prepare("INSERT INTO course_lessons (topic_id, title, sort_order, video_url, video_filename, pdf_filename) VALUES (?, ?, ?, ?, ?, ?)");
                                $stmt->execute([
                                    $topic_id, 
                                    $lessonData['title'] ?? 'Lesson', 
                                    $l_idx, 
                                    $lessonData['video_url'] ?? '', 
                                    $lessonData['video_filename'] ?? '', 
                                    $lessonData['pdf_filename'] ?? ''
                                ]);
                            }
                        }
                    }
                }
            }

            echo json_encode(["status" => "success", "id" => $course_id, "thumbnail" => $thumbnail_path]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        break;
}
?>
