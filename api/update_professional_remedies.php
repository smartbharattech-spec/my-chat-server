<?php
require_once 'config.php';

// Professional Remedies Map for Entrance Zones
$remedies = [
    // --- NORTH (Element: Water) ---
    // Remedy: Blue/Green Tape or SS Strip
    'N1' => "Blocked Money / Financial Losses.\nRemedy: Place a Blue or Green adhesive tape (3-4 inch wide) on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'N2' => "Instability / Fear.\nRemedy: Place a Blue or Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'N5' => "Over-religious / Unbalanced behavior.\nRemedy: Place a Blue or Green adhesive tape on the threshold.",
    'N6' => "Generally considered positive but if negative effects seen:\nRemedy: Place a Blue or Green adhesive tape on the threshold.",
    'N7' => "Addiction / Unhappiness.\nRemedy: Place a Blue or Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'N8' => "Loss of Wealth / Bank Balance issue.\nRemedy: Place a Blue adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",

    // --- EAST (Element: Air) ---
    // Remedy: Green Tape or SS Strip
    'E1' => "Fire Accidents / Losses.\nRemedy: Place a Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'E2' => "Expenses / Wasteful expenditure.\nRemedy: Place a Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'E5' => "Aggression / Temper issues.\nRemedy: Place a Green adhesive tape on the threshold.",
    'E6' => "Commitment Failure.\nRemedy: Place a Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'E7' => "Insensitivity / lack of empathy.\nRemedy: Place a Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",
    'E8' => "Financial Losses / Theft.\nRemedy: Place a Green adhesive tape on the threshold.\nAlternative: Install a Stainless Steel (SS) strip.",

    // --- SOUTH (Element: Fire) ---
    // Remedy: Red Tape or Copper Strip
    'S1' => "Negative effects on son / Growth block.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",
    'S2' => "Works well for MNC employees but can cause health issues.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",
    'S5' => "Debts / Poverty.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",
    'S6' => "Poverty / Loss of Fame.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",
    'S7' => "Drain of energies / Futile efforts.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",
    'S8' => "Isolation / Depression.\nRemedy: Place a Red adhesive tape on the threshold.\nAlternative: Install a Copper strip.",

    // --- WEST (Element: Space/Metal) ---
    // Remedy: White/Yellow Tape or Iron/Brass Strip
    'W1' => "Poverty / Lack of gains.\nRemedy: Place a White or Yellow adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
    'W2' => "Insecurity / Relationship issues.\nRemedy: Place a White or Yellow adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
    'W5' => "Over-ambition / Perfectionism.\nRemedy: Place a White adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
    'W6' => "Depression / Non-fulfillment.\nRemedy: Place a White adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
    'W7' => "Unhappiness / Addictions.\nRemedy: Place a White adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
    'W8' => "Gains blocked / Legal issues.\nRemedy: Place a White adhesive tape on the threshold.\nAlternative: Install an Iron strip.",
];

try {
    $stmt = $pdo->prepare("UPDATE entrance_remedies SET remedy = :rem WHERE zone_code = :zone AND is_positive = 0");

    $count = 0;
    foreach ($remedies as $zone => $rem) {
        $stmt->execute([':rem' => $rem, ':zone' => $zone]);
        $count += $stmt->rowCount();
    }

    echo "Successfully updated professional remedies for $count negative entrace zones.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>