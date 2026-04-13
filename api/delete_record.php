<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = $_POST['type'] ?? null; // 'user', 'project', 'payment'
    $id = $_POST['id'] ?? null; // Can be a single ID or a comma-separated list

    if (!$type || !$id) {
        echo json_encode(["status" => "error", "message" => "Type and ID are required."]);
        exit;
    }

    $table = "";
    switch ($type) {
        case 'user':
            $table = "users";
            break;
        case 'project':
            $table = "projects";
            break;
        case 'payment':
            $table = "payments";
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid deletion type."]);
            exit;
    }

    try {
        // Support for multiple IDs
        $ids = explode(',', $id);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        // Cleanup associated payments if deleting projects
        if ($type === 'project') {
            // Find user emails and plans for these projects before deleting
            $pStmt = $pdo->prepare("SELECT email, plan_name FROM projects WHERE id IN ($placeholders)");
            $pStmt->execute($ids);
            $projData = $pStmt->fetchAll(PDO::FETCH_ASSOC);

            // Reset single_purchase payments to make credit available again (instead of deleting)
            $resetStmt = $pdo->prepare("UPDATE payments SET project_id = NULL WHERE project_id IN ($placeholders) AND purchase_type = 'single_purchase'");
            $resetStmt->execute($ids);

            // Delete non-single payments (subscriptions etc)
            $cleanupStmt = $pdo->prepare("DELETE FROM payments WHERE project_id IN ($placeholders) AND purchase_type != 'single_purchase'");
            $cleanupStmt->execute($ids);

            // Sync user states if their active plan matches a deleted project plan and they have no others
            foreach ($projData as $pd) {
                if ($pd['plan_name'] && $pd['email']) {
                    // This is a simple sync: if they deleted a project with a plan, we check if they still have any other record of it
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE email = ? AND plan_name = ? AND id NOT IN ($placeholders)");
                    $checkStmt->execute(array_merge([$pd['email'], $pd['plan_name']], $ids)); // Pass $ids for the NOT IN clause
                    $projCount = $checkStmt->fetchColumn();

                    $checkStmt2 = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE email = ? AND plan = ?");
                    $checkStmt2->execute([$pd['email'], $pd['plan_name']]);
                    $payCount = $checkStmt2->fetchColumn();

                    if ($projCount == 0 && $payCount == 0) {
                        $upStmt = $pdo->prepare("UPDATE users SET plan = NULL, plan_id = NULL, plan_expiry = NULL, plan_activated_at = NULL WHERE email = ? AND plan = ?");
                        $upStmt->execute([$pd['email'], $pd['plan_name']]);
                    }
                }
            }
            // Now delete the projects themselves
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        }

        if ($type === 'payment') {
            // Find emails and plans before deleting
            $pStmt = $pdo->prepare("SELECT email, plan FROM payments WHERE id IN ($placeholders)");
            $pStmt->execute($ids);
            $payData = $pStmt->fetchAll(PDO::FETCH_ASSOC);

            // Standard delete
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id IN ($placeholders)");
            $stmt->execute($ids);

            // Sync user states
            foreach ($payData as $pd) {
                if ($pd['plan'] && $pd['email']) {
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE email = ? AND plan = ?");
                    $checkStmt->execute([$pd['email'], $pd['plan']]);
                    $payCount = $checkStmt->fetchColumn();

                    $checkStmt2 = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE email = ? AND plan_name = ?");
                    $checkStmt2->execute([$pd['email'], $pd['plan']]);
                    $projCount = $checkStmt2->fetchColumn();

                    if ($payCount == 0 && $projCount == 0) {
                        $upStmt = $pdo->prepare("UPDATE users SET plan = NULL, plan_id = NULL, plan_expiry = NULL, plan_activated_at = NULL WHERE email = ? AND plan = ?");
                        $upStmt->execute([$pd['email'], $pd['plan']]);
                    }
                }
            }
        } else if ($type === 'user') { // Added this else if to handle user deletion specifically
            // Standard delete for user type
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        }


        $count = $stmt->rowCount();
        if ($count > 0) {
            echo json_encode(["status" => "success", "message" => "$count " . ($count > 1 ? "records" : "record") . " deleted successfully."]);
        } else {
            echo json_encode(["status" => "error", "message" => "No records found to delete."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>