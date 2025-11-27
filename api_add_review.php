<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['event_id']) || !isset($data['rating'])) {
    echo json_encode(["success" => false, "message" => "Dados incompletos."]);
    exit;
}

try {
    // Verifica se já avaliou antes
    $check = $conn->prepare("SELECT id FROM reviews WHERE user_id = ? AND event_id = ?");
    $check->execute([$data['user_id'], $data['event_id']]);
    
    if ($check->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Você já avaliou este evento!"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$data['user_id'], $data['event_id'], $data['rating'], $data['comment']])) {
        echo json_encode(["success" => true, "message" => "Avaliação enviada!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao salvar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>