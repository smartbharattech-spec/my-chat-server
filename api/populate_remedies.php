<?php
require_once 'config.php';

try {
    // Defines sample remedies for negative zones
    // Ideally we would have specific remedies for each zone, but user asked for "sample remedy" for now.
    $sampleRemedy = "Generic Remedy: Apply a color tape matching the zone element or consult an expert.";

    // Update all entries where is_positive = 0 AND (remedy IS NULL OR remedy = '' OR remedy = 'Consult a Vastu Expert.')
    // We treat "Consult a Vastu Expert." as "not added" / placeholder
    $sql = "UPDATE entrance_remedies 
            SET remedy = :remedy 
            WHERE is_positive = 0 
            AND (remedy IS NULL OR remedy = '' OR remedy = 'Consult a Vastu Expert.')";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':remedy' => $sampleRemedy]);

    echo "Updated " . $stmt->rowCount() . " entries with sample remedy.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>