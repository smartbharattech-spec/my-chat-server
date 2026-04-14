<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=myvastutool', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $email = 'nikhilagarwal241195@gmail.com';
    
    // 1. Get Folders
    $stmt = $pdo->prepare('SELECT id, folder_name FROM workspace_folders WHERE user_email = ?');
    $stmt->execute([$email]);
    $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "FOLDERS: " . json_encode($folders) . "\n";
    
    // 2. Sample Project if any folder exists
    if (!empty($folders)) {
        $fid = $folders[0]['id'];
        echo "TESTING FOLDER ID: $fid\n";
        
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM projects WHERE folder_id = ?');
        $stmt->execute([$fid]);
        echo "COUNT FOR FOLDER $fid: " . $stmt->fetchColumn() . "\n";
    }
    
    // 3. Count projects in Root
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM projects WHERE email = ? AND folder_id IS NULL');
    $stmt->execute([$email]);
    echo "ROOT COUNT FOR $email: " . $stmt->fetchColumn() . "\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
