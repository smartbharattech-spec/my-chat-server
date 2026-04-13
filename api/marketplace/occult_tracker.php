<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true) ?? [];

// ─── GET ───────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // ---- User: get own entries ----
    if ($action === 'user_entries') {
        $user_id = (int)($_GET['user_id'] ?? 0);
        if (!$user_id) { echo json_encode(['status'=>'error','message'=>'user_id required']); exit; }

        $stmt = $pdo->prepare("
            SELECT t.*, 
                   u_exp.name as expert_name, 
                   u_exp.email as expert_email
            FROM occult_tracker t
            LEFT JOIN marketplace_users u_exp ON t.expert_id = u_exp.id
            WHERE t.user_id = ? 
               OR t.user_email = (SELECT email FROM marketplace_users WHERE id = ?)
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$user_id, $user_id]);
        $rows = $stmt->fetchAll();
        
        foreach ($rows as &$row) {
            $gStmt = $pdo->prepare("
                SELECT g.*, p.name as product_name, p.price as product_price, p.image_url as product_image
                FROM occult_tracker_guidance g
                LEFT JOIN marketplace_products p ON g.product_id = p.id
                WHERE g.tracker_id = ? 
                ORDER BY g.created_at DESC
            ");
            $gStmt->execute([$row['id']]);
            $row['guidance'] = $gStmt->fetchAll();
        }
        echo json_encode(['status'=>'success','data'=>$rows]);
        exit;
    }

    // ---- User: graph stats ----
    if ($action === 'user_stats') {
        $user_id = (int)($_GET['user_id'] ?? 0);
        if (!$user_id) { echo json_encode(['status'=>'error','message'=>'user_id required']); exit; }

        // Count totals
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(result_type='positive') as positive_count,
                SUM(result_type='negative') as negative_count,
                SUM(result_type='neutral') as neutral_count
            FROM occult_tracker 
            WHERE user_id = ? 
               OR user_email = (SELECT email FROM marketplace_users WHERE id = ?)
        ");
        $stmt->execute([$user_id, $user_id]);
        $totals = $stmt->fetch();

        // Last 30 days by date
        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count, result_type
            FROM occult_tracker
            WHERE (user_id = ? OR user_email = (SELECT email FROM marketplace_users WHERE id = ?)) 
              AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at), result_type
            ORDER BY date ASC
        ");
        $stmt->execute([$user_id, $user_id]);
        $graph = $stmt->fetchAll();

        echo json_encode(['status'=>'success','totals'=>$totals,'graph'=>$graph]);
        exit;
    }

    // ---- Expert: get all entries from users ----
    if ($action === 'expert_entries') {
        $expert_id = (int)($_GET['expert_id'] ?? 0);
        if (!$expert_id) { echo json_encode(['status'=>'error','message'=>'expert_id required']); exit; }

        $stmt = $pdo->prepare("
            SELECT t.*, 
                   COALESCE(t.user_name, '') as user_name,
                   COALESCE(t.user_email, '') as user_email
            FROM occult_tracker t
            WHERE t.expert_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$expert_id]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $gStmt = $pdo->prepare("
                SELECT g.*, p.name as product_name, p.price as product_price, p.image_url as product_image
                FROM occult_tracker_guidance g
                LEFT JOIN marketplace_products p ON g.product_id = p.id
                WHERE g.tracker_id = ? 
                ORDER BY g.created_at DESC
            ");
            $gStmt->execute([$row['id']]);
            $row['guidance'] = $gStmt->fetchAll();
        }

        echo json_encode(['status'=>'success','data'=>$rows]);
        exit;
    }

    // ---- Expert: stats ----
    if ($action === 'expert_stats') {
        $expert_id = (int)($_GET['expert_id'] ?? 0);
        if (!$expert_id) { echo json_encode(['status'=>'error','message'=>'expert_id required']); exit; }

        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(result_type='positive') as positive_count,
                SUM(result_type='negative') as negative_count,
                SUM(expert_remedy IS NOT NULL AND expert_remedy != '') as replied_count
            FROM occult_tracker WHERE expert_id = ?
        ");
        $stmt->execute([$expert_id]);
        $totals = $stmt->fetch();

        // Last 30 days
        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count, result_type
            FROM occult_tracker
            WHERE expert_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at), result_type
            ORDER BY date ASC
        ");
        $stmt->execute([$expert_id]);
        $graph = $stmt->fetchAll();

        echo json_encode(['status'=>'success','totals'=>$totals,'graph'=>$graph]);
        exit;
    }

    // ---- Admin: get all entries with filters ----
    if ($action === 'admin_all_entries') {
        $user_id = (int)($_GET['user_id'] ?? 0);
        $expert_id = (int)($_GET['expert_id'] ?? 0);
        $product_id = (int)($_GET['product_id'] ?? 0);
        $search = trim($_GET['search'] ?? '');

        $query = "
            SELECT t.*, 
                   u_user.name as user_display_name, 
                   u_user.email as user_display_email,
                   u_exp.name as expert_name, 
                   u_exp.email as expert_email
            FROM occult_tracker t
            LEFT JOIN marketplace_users u_user ON t.user_id = u_user.id
            LEFT JOIN marketplace_users u_exp ON t.expert_id = u_exp.id
            WHERE 1=1
        ";
        $params = [];

        if ($user_id) {
            $query .= " AND t.user_id = ?";
            $params[] = $user_id;
        }
        if ($expert_id) {
            $query .= " AND t.expert_id = ?";
            $params[] = $expert_id;
        }
        if ($search) {
            $query .= " AND (t.user_name LIKE ? OR t.user_email LIKE ? OR u_user.name LIKE ? OR u_user.email LIKE ? OR u_exp.name LIKE ? OR u_exp.email LIKE ? OR t.problem LIKE ?)";
            $search_param = "%$search%";
            $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param, $search_param, $search_param, $search_param]);
        }

        // Product filtering is tricky because it's in the guidance table
        if ($product_id) {
            $query .= " AND t.id IN (SELECT tracker_id FROM occult_tracker_guidance WHERE product_id = ?)";
            $params[] = $product_id;
        }

        $query .= " ORDER BY t.created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $gStmt = $pdo->prepare("
                SELECT g.*, p.name as product_name, p.price as product_price, p.image_url as product_image
                FROM occult_tracker_guidance g
                LEFT JOIN marketplace_products p ON g.product_id = p.id
                WHERE g.tracker_id = ? 
                ORDER BY g.created_at DESC
            ");
            $gStmt->execute([$row['id']]);
            $row['guidance'] = $gStmt->fetchAll();
        }

        echo json_encode(['status'=>'success','data'=>$rows]);
        exit;
    }

    // ---- Fetch user's regular project issues for expert use ----
    if ($action === 'fetch_user_projects') {
        $user_id = (int)($_GET['user_id'] ?? 0);
        if (!$user_id) { echo json_encode(['status'=>'error','message'=>'user_id required']); exit; }

        // We need to find projects where follower_id matches this user_id
        $stmt = $pdo->prepare("
            SELECT id, project_name, project_issue 
            FROM projects 
            WHERE follower_id = ? 
            OR email = (SELECT email FROM marketplace_users WHERE id = ?)
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id, $user_id]);
        echo json_encode(['status'=>'success', 'data'=>$stmt->fetchAll()]);
        exit;
    }

    echo json_encode(['status'=>'error','message'=>'Unknown action']);
    exit;
}

// ─── POST ──────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $action = $data['action'] ?? '';

    // ---- User submits a problem entry ----
    if ($action === 'submit_entry') {
        $user_id    = (int)($data['user_id'] ?? 0);
        $user_name  = trim($data['user_name'] ?? '');
        $user_email = trim($data['user_email'] ?? '');
        $expert_id  = !empty($data['expert_id']) ? (int)$data['expert_id'] : null;
        $problem    = trim($data['problem'] ?? '');
        $experience = trim($data['experience'] ?? '');
        $result_type = in_array($data['result_type'] ?? '', ['positive','negative','neutral']) 
                       ? $data['result_type'] : 'neutral';

        if (!$user_id || !$problem) {
            echo json_encode(['status'=>'error','message'=>'user_id and problem are required']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO occult_tracker 
                (user_id, user_name, user_email, expert_id, problem, experience, result_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
        ");
        $stmt->execute([$user_id, $user_name, $user_email, $expert_id, $problem, $experience, $result_type]);
        echo json_encode(['status'=>'success','message'=>'Entry submitted','id'=>$pdo->lastInsertId()]);
        exit;
    }

    // ---- Expert adds NEW guidance step ----
    if ($action === 'expert_reply') {
        $entry_id       = (int)($data['entry_id'] ?? 0);
        $expert_remedy  = trim($data['expert_remedy'] ?? '');
        $expert_task    = trim($data['expert_task'] ?? '');
        $expert_comment = trim($data['expert_comment'] ?? '');
        $status         = $data['status'] ?? 'assigned';
        $product_id     = !empty($data['product_id']) ? (int)$data['product_id'] : null;

        if (!$entry_id) {
            echo json_encode(['status'=>'error','message'=>'entry_id required']);
            exit;
        }

        // Restrict status to not be 'resolved' from expert side
        if ($status === 'resolved') {
            $status = 'assigned'; 
        }

        // Insert new guidance step
        $stmt = $pdo->prepare("
            INSERT INTO occult_tracker_guidance 
                (tracker_id, expert_remedy, expert_task, expert_comment, product_id) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$entry_id, $expert_remedy, $expert_task, $expert_comment, $product_id]);

        // Update overall tracker status
        $stmt = $pdo->prepare("UPDATE occult_tracker SET status = ?, expert_replied_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $entry_id]);
        
        echo json_encode(['status'=>'success', 'message'=>'Guidance step added']);
        exit;
    }

    // ---- User updates their action/experience for a SPECIFIC guidance ----
    if ($action === 'user_update') {
        $guidance_id  = (int)($data['guidance_id'] ?? 0);
        $user_action  = trim($data['user_action'] ?? '');
        $user_feedback = trim($data['experience'] ?? ''); // Maps 'experience' from frontend
        $final_result = trim($data['final_result'] ?? '');
        $result_type  = $data['result_type'] ?? 'neutral';

        if (!$guidance_id) {
            echo json_encode(['status'=>'error','message'=>'guidance_id required']);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE occult_tracker_guidance 
            SET user_action = ?, user_feedback = ?, final_result = ?, result_type = ?
            WHERE id = ?
        ");
        $stmt->execute([$user_action, $user_feedback, $final_result, $result_type, $guidance_id]);

        // If final_result is provided, we can mark the main tracker as resolved
        if (!empty($final_result)) {
            $stmt = $pdo->prepare("
                UPDATE occult_tracker t
                JOIN occult_tracker_guidance g ON t.id = g.tracker_id
                SET t.status = 'resolved', t.result_type = ?
                WHERE g.id = ?
            ");
            $stmt->execute([$result_type, $guidance_id]);
        }
        
        echo json_encode(['status'=>'success','message'=>'Guidance feedback saved']);
        exit;
    }

    // ---- Delete an entry (user only deletes their own) ----
    if ($action === 'delete_entry') {
        $entry_id = (int)($data['entry_id'] ?? 0);
        $user_id  = (int)($data['user_id'] ?? 0);
        if (!$entry_id || !$user_id) {
            echo json_encode(['status'=>'error','message'=>'entry_id and user_id required']);
            exit;
        }
        $stmt = $pdo->prepare("
            DELETE FROM occult_tracker 
            WHERE id = ? 
            AND (user_id = ? OR user_email = (SELECT email FROM marketplace_users WHERE id = ?))
        ");
        $stmt->execute([$entry_id, $user_id, $user_id]);
        echo json_encode(['status'=>'success','message'=>'Entry deleted']);
        exit;
    }

    echo json_encode(['status'=>'error','message'=>'Unknown action']);
    exit;
}

echo json_encode(['status'=>'error','message'=>'Invalid request method']);
?>
