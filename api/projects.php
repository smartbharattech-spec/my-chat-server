<?php
error_reporting(E_ALL);
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable error output to client to prevent JSON corruption
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}
require_once 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

function getUserIdsByEmail($pdo, $email) {
    if (empty($email)) return [];
    $ids = [];
    
    // Check users table
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $uIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $ids = array_merge($ids, $uIds);

    // Check marketplace_users table
    $stmt = $pdo->prepare("SELECT id FROM marketplace_users WHERE email = ?");
    $stmt->execute([$email]);
    $mIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $ids = array_merge($ids, $mIds);

    return array_unique(array_map('intval', $ids));
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';
        $email = $_GET['email'] ?? null;
        $project_name = $_GET['project_name'] ?? null;
        if ($action === 'check') {
            // Check if plan exists for email/follower + project
            $id = $_GET['id'] ?? null;
            $follower_id = $_GET['follower_id'] ?? null;
            
            if (empty($email) && empty($follower_id)) {
                echo json_encode(["status" => "error", "message" => "Email or Follower ID is required for check"]);
                break;
            }
            if (empty($project_name) && empty($id)) {
                echo json_encode(["status" => "error", "message" => "Project ID or Name is required for check"]);
                break;
            }

            try {
                // ID Synchronization logic for both 'users' and 'marketplace_users'
                $emailSubquery = "(SELECT email FROM users WHERE id = :follower_id UNION SELECT email FROM marketplace_users WHERE id = :follower_id LIMIT 1)";
                $followerIdMatch = "follower_id IN (SELECT id FROM users WHERE email = $emailSubquery UNION SELECT id FROM marketplace_users WHERE email = $emailSubquery)";
                
                if ($id) {
                    $stmt = $pdo->prepare("SELECT p.id, p.plan_id, p.plan_name, p.project_data, p.project_name, p.construction_type, p.property_type, p.map_image, p.project_issue, f.folder_name 
                                         FROM projects p 
                                         LEFT JOIN workspace_folders f ON p.folder_id = f.id 
                                         WHERE (p.email = :email OR p.follower_id IN (SELECT id FROM users WHERE email = $emailSubquery UNION SELECT id FROM marketplace_users WHERE email = $emailSubquery)) 
                                         AND p.id = :id LIMIT 1");
                    $stmt->execute(['email' => $email, 'follower_id' => $follower_id, 'id' => $id]);
                } else {
                    $stmt = $pdo->prepare("SELECT p.id, p.plan_id, p.plan_name, p.project_data, p.project_name, p.construction_type, p.property_type, p.map_image, p.project_issue, f.folder_name 
                                         FROM projects p 
                                         LEFT JOIN workspace_folders f ON p.folder_id = f.id 
                                         WHERE (p.email = :email OR p.follower_id IN (SELECT id FROM users WHERE email = $emailSubquery UNION SELECT id FROM marketplace_users WHERE email = $emailSubquery)) 
                                         AND p.project_name = :project_name LIMIT 1");
                    $stmt->execute(['email' => $email, 'follower_id' => $follower_id, 'project_name' => $project_name]);
                }
                $project = $stmt->fetch();
                if ($project) {
                    echo json_encode([
                        "status" => "success",
                        "purchased" => true, // Technically any project found is valid now, UI handles plan_id
                        "plan_id" => $project['plan_id'],
                        "plan_name" => $project['plan_name'],
                        "project_id" => $project['id'],
                        "project_data" => $project['project_data'],
                        "project_name" => $project['project_name'],
                        "construction_type" => $project['construction_type'],
                        "map_image" => $project['map_image'],
                        "project_issue" => $project['project_issue']
                    ]);
                } else {
                    echo json_encode(["status" => "success", "purchased" => false]);
                }
            } catch (PDOException $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        } else {
            // Fetch projects with pagination and filters
            try {
                $follower_id = $_GET['follower_id'] ?? null;
                $followerJoin = "LEFT JOIN marketplace_users fu ON p.follower_id = fu.id";

                if (!empty($follower_id)) {
                    $stmt = $pdo->prepare("SELECT p.*, u.name as expert_name, fu.name as follower_name FROM projects p 
                                          LEFT JOIN marketplace_users u ON p.expert_id = u.id 
                                          $followerJoin
                                          WHERE p.follower_id = ?
                                          ORDER BY p.created_at DESC");
                    $stmt->execute([$follower_id]);
                    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(["status" => "success", "data" => $results]);
                } elseif (!empty($email)) {
                    $userIds = getUserIdsByEmail($pdo, $email);
                    $sql = "SELECT p.*, u.name as expert_name, fu.name as follower_name FROM projects p 
                            LEFT JOIN marketplace_users u ON p.expert_id = u.id
                            $followerJoin";
                    $params = [];

                    if (!empty($userIds)) {
                        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
                        $sql .= " WHERE (p.follower_id IN ($placeholders) OR p.expert_id IN ($placeholders) OR p.email = ?)";
                        $params = array_merge($userIds, $userIds, [$email]);
                    } else {
                        $sql .= " WHERE p.email = ?";
                        $params = [$email];
                    }

                    $sql .= " ORDER BY p.created_at DESC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(["status" => "success", "data" => $results]);
                } else {
                    $stmt = $pdo->query("SELECT p.*, u.name as expert_name, fu.name as follower_name FROM projects p 
                                        LEFT JOIN marketplace_users u ON p.expert_id = u.id 
                                        $followerJoin
                                        ORDER BY p.created_at DESC");
                    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(["status" => "success", "data" => $results]);
                }
            } catch (PDOException $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;
    case 'POST':
        // Create new project
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['email']) || empty($data['project_name'])) {
            echo json_encode(["status" => "error", "message" => "Email and project_name are required"]);
            break;
        }

        try {
            // 1. Fetch User's Current Plan details
            $uStmt = $pdo->prepare("SELECT plan, plan_id, plan_expiry, plan_activated_at FROM users WHERE email = ?");
            $uStmt->execute([$data['email']]);
            $user = $uStmt->fetch(PDO::FETCH_ASSOC);

            // 2. Fetch Plan Details (if user has a plan)
            $plan = null;
            if ($user && ($user['plan_id'] || $user['plan'])) {
                $pStmt = $pdo->prepare("SELECT id, title, plan_type, credits, validity_days FROM plans WHERE id = ? OR title = ?");
                $pStmt->execute([$user['plan_id'] ?? -1, $user['plan'] ?? '']);
                $plan = $pStmt->fetch(PDO::FETCH_ASSOC);
            }

            $useSinglePaymentId = null;
            $creationPlanName = $data['plan_name'] ?? ($user['plan'] ?? null);
            $creationPlanId = $data['plan_id'] ?? ($user ? ($user['plan_id'] ?: null) : null);

            // 3. Credit Check & Single Purchase Fallback
            if ($user && ($user['plan_id'] || $user['plan']) && $plan) {
                $userPlanTitle = $user['plan'];
                $userPlanId = $user['plan_id'];

                if ($plan['plan_type'] === 'subscription' && $user['plan_activated_at']) {
                    // Count projects created after activation, BUT EXCLUDE those that are tied to a SINGLE PLAN purchase
                    // We check if the project's assigned plan is 'single'
                    $countStmt = $pdo->prepare("
                        SELECT COUNT(*) as count 
                        FROM projects p
                        LEFT JOIN plans pl ON p.plan_id = pl.id
                        LEFT JOIN plans pl2 ON p.plan_name = pl2.title
                        WHERE p.email = ? 
                        AND p.created_at >= ?
                        AND (pl.plan_type != 'single' OR pl.plan_type IS NULL)
                        AND (pl2.plan_type != 'single' OR pl2.plan_type IS NULL)
                    ");
                    $countStmt->execute([$data['email'], $user['plan_activated_at']]);
                } else {
                    // For single purchase, count projects explicitly tied to THIS plan (by ID or Title)
                    $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM projects WHERE email = ? AND (plan_id = ? OR plan_name = ?)");
                    $countStmt->execute([$data['email'], $userPlanId ?: -1, $userPlanTitle ?: '']);
                }

                $currentProjectsCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];

                if ($currentProjectsCount >= $plan['credits'] && $plan['credits'] > 0) {
                    // PRIMARY PLAN EXHAUSTED - LOOK FOR UNUSED SINGLE PURCHASES
                    $sStmt = $pdo->prepare("SELECT id, plan, plan_id FROM payments WHERE email = ? AND status = 'Active' AND purchase_type = 'single_purchase' AND project_id IS NULL LIMIT 1");
                    $sStmt->execute([$data['email']]);
                    $unusedPayment = $sStmt->fetch(PDO::FETCH_ASSOC);

                    if ($unusedPayment) {
                        $useSinglePaymentId = $unusedPayment['id'];
                        $creationPlanName = $unusedPayment['plan'];
                        $creationPlanId = $unusedPayment['plan_id'];
                    } elseif (isset($data['plan_name'])) {
                        // USER IS ABOUT TO PURCHASE A SINGLE PLAN - ALLOW CREATION
                        // This project will be effectively "Unpaid" until payment is approved
                        $creationPlanName = $data['plan_name'];
                        $creationPlanId = $data['plan_id'] ?? null;
                    } else {
                        echo json_encode(["status" => "error", "message" => "You have reached the project limit (" . $plan['credits'] . ") for your current plan."]);
                        break;
                    }
                }
            } elseif (isset($data['plan_name'])) {
                // NO CURRENT PLAN, BUT PURCHASING ONE - ALLOW CREATION
                $creationPlanName = $data['plan_name'];
                $creationPlanId = $data['plan_id'] ?? null;
            }

            // 5. Check if follow-up is enabled for this plan
            $f_status = 'none';
            $f_start = null;
            if ($creationPlanId || $creationPlanName) {
                $fCheckStmt = $pdo->prepare("SELECT followup_enabled FROM plans WHERE id = ? OR title = ?");
                $fCheckStmt->execute([$creationPlanId ?? -1, $creationPlanName ?? '']);
                $fPlan = $fCheckStmt->fetch();
                if ($fPlan && (int) ($fPlan['followup_enabled'] ?? 0) === 1) {
                    $f_status = 'pending';
                    // Use user's plan activation date if available, otherwise current time
                    $f_start = ($user && $user['plan_activated_at']) ? $user['plan_activated_at'] : date('Y-m-d H:i:s');
                }
            }

            // 6. Proceed with creation
            $stmt = $pdo->prepare("INSERT INTO projects (email, expert_id, follower_id, project_name, construction_type, property_type, project_issue, plan_name, plan_id, project_data, followup_status, followup_start_at, folder_id) VALUES (:email, :expert_id, :follower_id, :project_name, :construction_type, :property_type, :project_issue, :plan_name, :plan_id, :project_data, :followup_status, :followup_start_at, :folder_id)");
            $stmt->execute([
                'email' => $data['email'],
                'expert_id' => $data['expert_id'] ?? null,
                'follower_id' => $data['follower_id'] ?? null,
                'project_name' => $data['project_name'],
                'construction_type' => $data['construction_type'] ?? 'Existing',
                'property_type' => $data['property_type'] ?? 'Residential',
                'project_issue' => $data['project_issue'] ?? null,
                'plan_name' => $creationPlanName,
                'plan_id' => $creationPlanId,
                'project_data' => $data['project_data'] ?? null,
                'followup_status' => $f_status,
                'followup_start_at' => $f_start,
                'folder_id' => $data['folder_id'] ?? null
            ]);
            $newProjectId = $pdo->lastInsertId();

            // 6. If we used a single payment slot, bind it to this project
            if ($useSinglePaymentId) {
                $upStmt = $pdo->prepare("UPDATE payments SET project_id = ? WHERE id = ?");
                $upStmt->execute([$newProjectId, $useSinglePaymentId]);
            }

            echo json_encode(["status" => "success", "message" => "Project created successfully", "id" => $newProjectId]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
    case 'PUT':
        // Update project
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['id'])) {
            echo json_encode(["status" => "error", "message" => "Project ID is required"]);
            break;
        }

        $project_id = $data['id'];
        $map_image_filename = null;

        // 🖼️ EXTRACT IMAGE FROM project_data IF PRESENT
        if (isset($data['project_data'])) {
            $project_state = json_decode($data['project_data'], true);

            if ($project_state && isset($project_state['image']) && strpos($project_state['image'], 'data:image') === 0) {
                $base64_string = $project_state['image'];

                // Extract extension and data
                if (preg_match('/^data:image\/(\w+);base64,/', $base64_string, $type)) {
                    $image_data = substr($base64_string, strpos($base64_string, ',') + 1);
                    $image_data = base64_decode($image_data);
                    $extension = strtolower($type[1]);

                    if ($image_data) {
                        // Generate Unique Name
                        $filename = "map_" . $project_id . "_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $extension;
                        $upload_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'maps' . DIRECTORY_SEPARATOR;

                        if (!is_dir($upload_dir)) {
                            mkdir($upload_dir, 0777, true);
                        }

                        if (file_put_contents($upload_dir . $filename, $image_data)) {
                            $map_image_filename = $filename;

                            // 🧹 CLEANUP: Remove large image from JSON to keep DB light
                            unset($project_state['image']);
                            $data['project_data'] = json_encode($project_state);

                            // 🗑️ DELETE OLD FILE IF EXISTS
                            $stmt_old = $pdo->prepare("SELECT map_image FROM projects WHERE id = :id");
                            $stmt_old->execute(['id' => $project_id]);
                            $old_res = $stmt_old->fetch();
                            if ($old_res && !empty($old_res['map_image'])) {
                                $old_file_path = $upload_dir . $old_res['map_image'];
                                if (file_exists($old_file_path)) {
                                    @unlink($old_file_path);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Allow partial updates
        $fields = [];
        $params = ['id' => $project_id];

        if ($map_image_filename) {
            $fields[] = "map_image = :map_image";
            $params['map_image'] = $map_image_filename;
        }
        if (isset($data['email'])) {
            $fields[] = "email = :email";
            $params['email'] = $data['email'];
        }
        if (isset($data['project_name'])) {
            $fields[] = "project_name = :project_name";
            $params['project_name'] = $data['project_name'];
        }
        if (isset($data['construction_type'])) {
            $fields[] = "construction_type = :construction_type";
            $params['construction_type'] = $data['construction_type'];
        }
        if (isset($data['property_type'])) {
            $fields[] = "property_type = :property_type";
            $params['property_type'] = $data['property_type'];
        }
        if (isset($data['project_issue'])) {
            $fields[] = "project_issue = :project_issue";
            $params['project_issue'] = $data['project_issue'];
        }
        if (isset($data['plan_name'])) {
            $fields[] = "plan_name = :plan_name";
            $params['plan_name'] = $data['plan_name'];
        }
        if (isset($data['plan_id'])) {
            $fields[] = "plan_id = :plan_id";
            $params['plan_id'] = $data['plan_id'];
        }
        if (isset($data['project_data'])) {
            $fields[] = "project_data = :project_data";
            $params['project_data'] = $data['project_data'];
        }
        if (array_key_exists('folder_id', $data)) {
            $fields[] = "folder_id = :folder_id";
            $params['folder_id'] = ($data['folder_id'] === 'root' || $data['folder_id'] === '') ? null : $data['folder_id'];
        }
        if (isset($data['expert_id'])) {
            $fields[] = "expert_id = :expert_id";
            $params['expert_id'] = $data['expert_id'];
        }
        if (isset($data['follower_id'])) {
            $fields[] = "follower_id = :follower_id";
            $params['follower_id'] = $data['follower_id'];
        }
        if (empty($fields)) {
            echo json_encode(["status" => "error", "message" => "No fields provided to update"]);
            break;
        }
        try {
            $sql = "UPDATE projects SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(["status" => "success", "message" => "Project updated successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? ($_GET['id'] ?? null);
        $ids = $data['ids'] ?? null;
        $email = $data['email'] ?? ($_GET['email'] ?? null);

        if (!$email) {
            echo json_encode(["status" => "error", "message" => "User email is required for security"]);
            break;
        }

        if (!$id && !$ids) {
            echo json_encode(["status" => "error", "message" => "Project ID or IDs are required"]);
            break;
        }

        try {
            if ($ids && is_array($ids)) {
                // Bulk Delete with ownership check
                $placeholders = str_repeat('?,', count($ids) - 1) . '?';
                $stmt = $pdo->prepare("DELETE FROM projects WHERE email = ? AND id IN ($placeholders)");
                $params = array_merge([$email], $ids);
                $stmt->execute($params);
                echo json_encode(["status" => "success", "message" => $stmt->rowCount() . " projects deleted successfully"]);
            } else {
                // Single Delete with ownership check
                $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND email = ?");
                $stmt->execute([$id, $email]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(["status" => "success", "message" => "Project deleted successfully"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Project not found or access denied"]);
                }
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
    default:
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
        break;
}
?>