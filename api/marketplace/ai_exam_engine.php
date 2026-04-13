<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';
$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;

if ($user_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid user ID.']);
    exit;
}

function get_setting($pdo, $key) {
    $stmt = $pdo->prepare("SELECT setting_value FROM marketplace_settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    return $stmt->fetchColumn();
}

function call_huggingface($api_key, $prompt, $system_instruction = "") {
    // Using Llama-3.1-8B-Instruct which is widely supported on HF Router
    $model_id = "meta-llama/Llama-3.1-8B-Instruct";
    $url = "https://router.huggingface.co/v1/chat/completions";
    
    $messages = [];
    if ($system_instruction) {
        $messages[] = ['role' => 'system', 'content' => $system_instruction];
    }
    $messages[] = ['role' => 'user', 'content' => $prompt];

    $post_data = [
        'model' => $model_id,
        'messages' => $messages,
        'max_tokens' => 1000,
        'temperature' => 0.7,
        'stream' => false
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key
    ]);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception("CURL Error: " . $error);
    }

    $result = json_decode($response, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        $error_msg = $result['error']['message'] ?? ($result['error'] ?? 'Unknown Error');
        throw new Exception("HuggingFace Error: " . $error_msg);
    }

    $content = $result['choices'][0]['message']['content'];
    
    // Attempt to extract JSON if it's wrapped in text or markdown
    $content = preg_replace('/^```json\s*|```$/', '', trim($content));
    if (preg_match('/\{.*\}/s', $content, $matches)) {
        return json_decode($matches[0], true);
    }

    return json_decode($content, true);
}

try {
    $ai_key = get_setting($pdo, 'openai_api_key'); 
    $ai_instructions = get_setting($pdo, 'openai_instructions');

    if (empty($ai_key)) {
        echo json_encode(['status' => 'error', 'message' => 'Hugging Face API Key not set by Admin.']);
        exit;
    }

    if ($action === 'generate_exam') {
        $stmt = $pdo->prepare("SELECT * FROM expert_profiles WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();

        $prompt = "Generate 5 professional exam questions for an expert with the following profile:
        Experience: {$profile['experience_years']} years
        Expertise: {$profile['expertise_tags']}
        Additional Info: {$profile['custom_details']}
        
        The questions should be in Professional English. 
        Return a JSON object with a 'questions' array. Each question should have an 'id' and 'text'.";

        $exam_data = call_huggingface($ai_key, $prompt, $ai_instructions);
        
        $stmt = $pdo->prepare("UPDATE expert_profiles SET ai_exam_data = ?, ai_exam_status = 'started' WHERE user_id = ?");
        $stmt->execute([json_encode($exam_data), $user_id]);

        echo json_encode(['status' => 'success', 'data' => $exam_data]);

    } elseif ($action === 'submit_and_evaluate') {
        $answers = $data['answers']; // Array of {id, answer}
        
        $stmt = $pdo->prepare("SELECT * FROM expert_profiles WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();
        $exam_data = json_decode($profile['ai_exam_data'], true);

        $prompt = "Evaluate the following exam answers for an expert in occult sciences.
        Questions and Answers: " . json_encode(['questions' => $exam_data['questions'], 'answers' => $answers]) . "
        
        Return a JSON object with:
        1. 'marks': A score out of 100.
        2. 'remarks': A detailed diagnostic feedback in Hindi/English mix ('kaun kitna paani mein hai' style).
        3. 'interview_questions': 10 unique questions for the Admin to ask in a follow-up interview.
        ";

        $evaluation = call_huggingface($ai_key, $prompt, $ai_instructions);
        
        // Store expert answers and AI evaluation
        $exam_data['expert_answers'] = $answers;
        
        $stmt = $pdo->prepare("
            UPDATE expert_profiles 
            SET ai_exam_data = ?, 
                ai_exam_marks = ?, 
                ai_exam_remarks = ?, 
                admin_interview_questions = ?,
                ai_exam_status = 'evaluated' 
            WHERE user_id = ?
        ");
        $stmt->execute([
            json_encode($exam_data),
            $evaluation['marks'],
            $evaluation['remarks'],
            json_encode($evaluation['interview_questions']),
            $user_id
        ]);

        echo json_encode(['status' => 'success', 'evaluation' => $evaluation]);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'AI Error: ' . $e->getMessage()]);
}
?>
