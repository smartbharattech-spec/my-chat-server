<?php
header("Content-Type: application/json");
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

// 🖼️ Helper to save base64 image
function getUserIdsByEmail($pdo, $email) {
    if (empty($email)) return [];
    $ids = [];
    
    // Check users table
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $uId = $stmt->fetchColumn();
    if ($uId) $ids[] = (int)$uId;

    // Check marketplace_users table
    $stmt = $pdo->prepare("SELECT id FROM marketplace_users WHERE email = ?");
    $stmt->execute([$email]);
    $mId = $stmt->fetchColumn();
    if ($mId) $ids[] = (int)$mId;

    return array_unique($ids);
}

function saveBase64Image($base64Data, $prefix = 'tracker_') {
    if (empty($base64Data)) return null;
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
        $image_data = substr($base64Data, strpos($base64Data, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, gif, webp
        if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
            return null;
        }
        $image_data = base64_decode($image_data);
        if ($image_data === false) return null;
    } else {
        return null;
    }

    $fileName = $prefix . uniqid() . '.' . $type;
    $upload_dir = __DIR__ . '/uploads/tracker/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    if (file_put_contents($upload_dir . $fileName, $image_data)) {
        return 'api/uploads/tracker/' . $fileName;
    }
    return null;
}

function getRemediesFromProjectData($projectData, $pdo = null) {
    if (empty($projectData)) return [];
    $projectState = json_decode($projectData, true);
    if (!$projectState) return [];
    
    $remedies = [];

    // From Entrances - lookup remedy text from DB if not in project_data
    if (isset($projectState['entrances']) && is_array($projectState['entrances'])) {
        foreach ($projectState['entrances'] as $idx => $ent) {
            $zone = $ent['zone'] ?? null;
            $category = $ent['category'] ?? 'Entrance';
            $spec = $ent['specification'] ?? 'Entrance Correction';

            // Priority 1: Custom remedy set by expert in project
            if (isset($ent['useCustomRemedy']) && $ent['useCustomRemedy'] && !empty($ent['customRemedy'])) {
                $remText = $ent['customRemedy'];
            } else {
                // Priority 2: Lookup from entrance_remedies table by zone + category
                $remText = '';
                if ($pdo && $zone) {
                    try {
                        $rStmt = $pdo->prepare(
                            "SELECT remedy FROM entrance_remedies WHERE zone_code = ? AND category = ? AND status = 'active' ORDER BY expert_id DESC LIMIT 1"
                        );
                        $rStmt->execute([$zone, $category]);
                        $dbRemedy = $rStmt->fetchColumn();
                        if ($dbRemedy) $remText = $dbRemedy;
                    } catch (Exception $e) {
                        error_log("Tracker remedy lookup error: " . $e->getMessage());
                    }
                }
            }

            // Only add to tracker if there is a remedy text OR if it's in a zone (always track mapped entrances)
            if ($zone) {
                $remedies[] = [
                    'id' => 'ent_' . $idx,
                    'title' => $category . ' (' . $zone . ')',
                    'problem' => $spec,
                    'steps' => $remText ?: ('No specific remedy assigned for ' . $category . ' in zone ' . $zone),
                    'zone' => $zone,
                    'type' => 'entrance'
                ];
            }
        }
    }

    // From Custom Zone Remedies
    if (isset($projectState['customZoneRemedies']) && is_array($projectState['customZoneRemedies'])) {
        foreach ($projectState['customZoneRemedies'] as $idx => $rem) {
            // Support both 'zone' (string) and 'zones' (array)
            $zoneVal = $rem['zone'] ?? null;
            if (!$zoneVal && isset($rem['zones']) && is_array($rem['zones'])) {
                $zoneVal = implode(', ', $rem['zones']);
            }
            $remedyText = $rem['remedy'] ?? '';
            // Always add customZoneRemedies to tracker (even if no text yet)
            $remedies[] = [
                'id' => 'czr_' . ($rem['id'] ?? $idx),
                'title' => 'Zone Remedy (' . ($zoneVal ?: 'Unknown') . ')',
                'problem' => 'Vastu Correction for Zone: ' . ($zoneVal ?: 'Unknown'),
                'steps' => $remedyText ?: 'Expert remedy steps pending.',
                'zone' => $zoneVal,
                'type' => 'zone'
            ];
        }
    }
    return $remedies;
}

function syncProjectRemedies($pdo, $projectId) {
    try {
        $stmt = $pdo->prepare("SELECT id, project_name, project_data, email, follower_id, expert_id FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$project || !$project['project_data']) return;

        // Pass $pdo so remedy text can be fetched from entrance_remedies table
        $remedies = getRemediesFromProjectData($project['project_data'], $pdo);
        if (empty($remedies)) return;

        // Get admin email (expert) or fallback
        $admin_email = null;
        if ($project['expert_id']) {
            $eStmt = $pdo->prepare("SELECT email FROM marketplace_users WHERE id = ? UNION SELECT email FROM users WHERE id = ? LIMIT 1");
            $eStmt->execute([$project['expert_id'], $project['expert_id']]);
            $admin_email = $eStmt->fetchColumn();
        }

        // Get user email (follower)
        $user_email = $project['email'];
        if ($project['follower_id']) {
            $fStmt = $pdo->prepare("SELECT email FROM marketplace_users WHERE id = ? UNION SELECT email FROM users WHERE id = ? LIMIT 1");
            $fStmt->execute([$project['follower_id'], $project['follower_id']]);
            $user_email = $fStmt->fetchColumn() ?: $user_email;
        }

        foreach ($remedies as $rem) {
            // Check if already in tracker
            $checkStmt = $pdo->prepare("SELECT id, steps FROM tracker_submissions WHERE project_id = ? AND remedy_id = ?");
            $checkStmt->execute([$projectId, $rem['id']]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existing) {
                // Auto insert new entry
                $insStmt = $pdo->prepare("INSERT INTO tracker_submissions (project_id, project_name, user_email, admin_email, problem, steps, remedy_id, category, zone, status, initiated_by, result_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'remedy', ?, 'pending', 'expert', 'pending')");
                $insStmt->execute([
                    $projectId, $project['project_name'], $user_email, $admin_email,
                    $rem['problem'], $rem['steps'], $rem['id'], $rem['zone']
                ]);
            } elseif (empty(trim($existing['steps'] ?? '')) || $existing['steps'] !== $rem['steps']) {
                // Backfill or Update: update with fresh remedy text if changed
                $updStmt = $pdo->prepare("UPDATE tracker_submissions SET steps = ?, problem = ?, admin_email = ? WHERE project_id = ? AND remedy_id = ?");
                $updStmt->execute([$rem['steps'], $rem['problem'], $admin_email, $projectId, $rem['id']]);
            }
        }
    } catch (Exception $e) {
        error_log("Tracker Sync Error: " . $e->getMessage());
    }
}

if ($method === 'POST') {
    $action = $data['action'] ?? '';

    if ($action === 'submit') {
        $projectId = $data['project_id'] ?? 0;
        $projectName = $data['project_name'] ?? '';
        $email = $data['email'] ?? '';
        $problem = $data['problem'] ?? '';
        $steps = $data['steps'] ?? '';
        $experience = $data['experience'] ?? '';
        $userImageBase64 = $data['user_image'] ?? null;
        $remedyId = $data['remedy_id'] ?? null;
        $category = $data['category'] ?? 'manual';
        $zone = $data['zone'] ?? null;

        $admin_email = $data['admin_email'] ?? '';

        if (empty($email) || empty($projectId)) {
            echo json_encode(["status" => "error", "message" => "Project ID and Email are required"]);
            exit;
        }

        $userImagePath = saveBase64Image($userImageBase64, 'user_');

        try {
            $stmt = $pdo->prepare("INSERT INTO tracker_submissions (project_id, project_name, user_email, admin_email, problem, steps, experience, user_image, remedy_id, category, zone, status, initiated_by, result_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending')");
            $stmt->execute([
                $projectId, $projectName, $email, $admin_email, 
                $problem, $steps, $experience, $userImagePath, 
                $remedyId, $category, $zone, $data['initiated_by'] ?? 'user'
            ]);
            echo json_encode(["status" => "success", "message" => "Tracker created successfully", "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'get_project_remedies') {
        $projectId = $data['project_id'] ?? 0;
        if (empty($projectId)) {
            echo json_encode(["status" => "error", "message" => "Project ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT project_data, project_name FROM projects WHERE id = ?");
            $stmt->execute([$projectId]);
            $project = $stmt->fetch();

            if (!$project || !$project['project_data']) {
                echo json_encode(["status" => "error", "message" => "Project not found or empty"]);
                exit;
            }

            $remedies = getRemediesFromProjectData($project['project_data'], $pdo);
            echo json_encode(["status" => "success", "data" => $remedies]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'update_status') {
        $id = $data['id'] ?? 0;
        $status = $data['status'] ?? 'completed';
        $experience = $data['experience'] ?? '';
        $userImageBase64 = $data['user_image'] ?? null;

        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
            exit;
        }

        $userImagePath = saveBase64Image($userImageBase64, 'user_');

        try {
            $sql = "UPDATE tracker_submissions SET status = ?, experience = ?";
            $params = [$status, $experience];
            
            if ($userImagePath) {
                $sql .= ", user_image = ?";
                $params[] = $userImagePath;
            }
            
            $sql .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // 💬 Add to chat history IF there is something to say
            if(!empty($experience) || $userImagePath) {
                $chatStmt = $pdo->prepare("INSERT INTO tracker_chats (submission_id, sender_role, message, image) VALUES (?, 'user', ?, ?)");
                $chatStmt->execute([$id, $experience, $userImagePath]);
            }

            echo json_encode(["status" => "success", "message" => "Update received", "image_url" => $userImagePath]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'update_note') {
        $id = $data['id'] ?? 0;
        $note = $data['admin_note'] ?? '';
        $expertImageBase64 = $data['expert_image'] ?? null;
        $resultStatus = $data['result_status'] ?? 'working';

        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
            exit;
        }

        $expertImagePath = saveBase64Image($expertImageBase64, 'expert_');

        try {
            $sql = "UPDATE tracker_submissions SET admin_note = ?, result_status = ?";
            $params = [$note, $resultStatus];

            if ($expertImagePath) {
                $sql .= ", expert_image = ?";
                $params[] = $expertImagePath;
            }

            $sql .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // 💬 Add to chat history IF there is something to say
            if(!empty($note) || $expertImagePath) {
                $chatStmt = $pdo->prepare("INSERT INTO tracker_chats (submission_id, sender_role, message, image) VALUES (?, 'expert', ?, ?)");
                $chatStmt->execute([$id, $note, $expertImagePath]);
            }

            echo json_encode(["status" => "success", "message" => "Observation saved", "image_url" => $expertImagePath]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'get_chats') {
        $submissionId = $data['submission_id'] ?? 0;
        if (empty($submissionId)) {
            echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM tracker_chats WHERE submission_id = ? ORDER BY created_at ASC");
            $stmt->execute([$submissionId]);
            $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $chats]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'send_chat') {
        $submissionId = $data['submission_id'] ?? 0;
        $role = $data['role'] ?? ''; // 'user' or 'expert'
        $message = $data['message'] ?? '';
        $imageBase64 = $data['image'] ?? null;

        if (empty($submissionId) || empty($role)) {
            echo json_encode(["status" => "error", "message" => "ID and Role are required"]);
            exit;
        }

        $imagePath = saveBase64Image($imageBase64, $role . '_');

        try {
            $stmt = $pdo->prepare("INSERT INTO tracker_chats (submission_id, sender_role, message, image) VALUES (?, ?, ?, ?)");
            $stmt->execute([$submissionId, $role, $message, $imagePath]);
            
            // Also update the main submission status if user replies
            if ($role === 'user') {
                $pdo->prepare("UPDATE tracker_submissions SET status = 'completed' WHERE id = ?")->execute([$submissionId]);
            }

            echo json_encode(["status" => "success", "message" => "Message sent", "image_url" => $imagePath]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'submit_review') {
        $id = $data['id'] ?? 0;
        $rating = $data['rating'] ?? 0;
        $review = $data['review'] ?? '';

        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE tracker_submissions SET rating = ?, review_text = ?, experience = ? WHERE id = ?");
            $stmt->execute([$rating, $review, $review, $id]);
            
            // Optionally add a system message to the chat
            $msg = "User submitted a review: " . $rating . " stars. " . $review;
            $chatStmt = $pdo->prepare("INSERT INTO tracker_chats (submission_id, sender_role, message) VALUES (?, 'user', ?)");
            $chatStmt->execute([$id, $msg]);

            echo json_encode(["status" => "success", "message" => "Review submitted successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'GET') {
    $email = $_GET['email'] ?? '';
    $projectId = $_GET['project_id'] ?? null;

    try {
        if (!empty($projectId)) {
            // Trigger sync for this single project
            syncProjectRemedies($pdo, $projectId);

            // Fetch ALL remedies for this project (Vastu Tool view)
            $sql = "SELECT ts.*, p.project_name as p_name FROM tracker_submissions ts 
                    LEFT JOIN projects p ON ts.project_id = p.id 
                    WHERE ts.project_id = ? 
                    ORDER BY ts.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$projectId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $results]);
        } elseif (!empty($email)) {
             // Identify ALL user IDs from both tables
             $userIds = getUserIdsByEmail($pdo, $email);

             if (!empty($userIds)) {
                 // Trigger sync for all follower projects linked to ANY of the user IDs or email
                 $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
                 $syncStmt = $pdo->prepare("SELECT id FROM projects WHERE follower_id IN ($placeholders) OR email = ?");
                 $syncStmt->execute(array_merge($userIds, [$email]));
                 $syncProjs = $syncStmt->fetchAll(PDO::FETCH_COLUMN);
                 foreach ($syncProjs as $pId) {
                     syncProjectRemedies($pdo, $pId);
                 }

                 $sql = "SELECT ts.*, p.project_name as p_name FROM tracker_submissions ts 
                         LEFT JOIN projects p ON ts.project_id = p.id 
                         WHERE (p.follower_id IN ($placeholders) OR p.expert_id IN ($placeholders) OR ts.user_email = ? OR ts.admin_email = ?)";
                 $stmt = $pdo->prepare($sql);
                 $stmt->execute(array_merge($userIds, $userIds, [$email, $email]));
             } else {
                 $sql = "SELECT ts.*, p.project_name as p_name FROM tracker_submissions ts 
                         LEFT JOIN projects p ON ts.project_id = p.id 
                         WHERE (ts.user_email = ? OR ts.admin_email = ?)";
                 $stmt = $pdo->prepare($sql);
                 $stmt->execute([$email, $email]);
             }
             
             $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
             echo json_encode(["status" => "success", "data" => $results]);
        } else {
            $stmt = $pdo->query("SELECT * FROM tracker_submissions ORDER BY created_at DESC");
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $submissions]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>