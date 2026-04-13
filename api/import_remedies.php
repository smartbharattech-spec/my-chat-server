<?php
header("Content-Type: application/json");
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!isset($_FILES['csv_file'])) {
        echo json_encode(["status" => "error", "message" => "No file uploaded"]);
        exit;
    }

    $file = $_FILES['csv_file']['tmp_name'];
    $category = $_POST['category'] ?? 'Entrance';

    if (($handle = fopen($file, "r")) !== FALSE) {
        // Skip header row
        fgetcsv($handle);

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO entrance_remedies (category, zone_code, is_positive, remedy, status) VALUES (?, ?, ?, ?, 'active')");

            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                // Determine zone code. Some CSVs might have different column order, assuming:
                // Col 0: Zone Code (e.g., N1 or N)
                // Col 1: Nature (Positive/Negative or 1/0)
                // Col 2: Remedy Text
                
                $zone = trim($data[0]);
                $nature = strtolower(trim($data[1]));
                $remedy = trim($data[2]);

                $is_positive = (in_array($nature, ['positive', '1', 'yes', 'true'])) ? 1 : 0;

                // Basic validation
                if (!empty($zone)) {
                    $stmt->execute([$category, $zone, $is_positive, $remedy]);
                }
            }

            $pdo->commit();
            fclose($handle);
            echo json_encode(["status" => "success", "message" => "CSV imported successfully"]);

        } catch (Exception $e) {
            $pdo->rollBack();
            fclose($handle);
            echo json_encode(["status" => "error", "message" => "Import failed: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Could not open file"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>
