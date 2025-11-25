<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['event_id']) || !isset($data['token'])) {
    echo json_encode(["success" => false, "message" => "QR Code inválido ou incompleto."]);
    exit;
}

$userId = $data['user_id'];
$eventId = $data['event_id'];
$tokenRecebido = $data['token'];

try {
    $stmtToken = $conn->prepare("SELECT id FROM events WHERE id = ? AND qr_token = ? AND qr_expires_at > NOW()");
    $stmtToken->execute([$eventId, $tokenRecebido]);

    if ($stmtToken->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "QR Code expirado ou inválido! Atualize a tela."]);
        exit;
    }

    $stmtCheck = $conn->prepare("SELECT id FROM checkins WHERE user_id = ? AND event_id = ?");
    $stmtCheck->execute([$userId, $eventId]);
    
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Você já fez check-in!"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO checkins (user_id, event_id) VALUES (?, ?)");
    if ($stmt->execute([$userId, $eventId])) {
        echo json_encode(["success" => true, "message" => "Check-in confirmado!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao salvar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>