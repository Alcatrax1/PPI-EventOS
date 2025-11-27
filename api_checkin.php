<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['event_id']) || !isset($data['token'])) {
    echo json_encode(["success" => false, "message" => "QR Code inválido."]);
    exit;
}

$userId = $data['user_id'];
$eventId = $data['event_id'];
$tokenRecebido = $data['token'];

try {
    // 1. Valida o Token do QR Code (Segurança)
    $stmtToken = $conn->prepare("SELECT id FROM events WHERE id = ? AND qr_token = ? AND qr_expires_at > NOW()");
    $stmtToken->execute([$eventId, $tokenRecebido]);

    if ($stmtToken->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "QR Code expirado! Atualize a tela do Admin."]);
        exit;
    }

    // 2. A MUDANÇA ESTÁ AQUI: Verifica se já fez check-in HOJE
    // Usamos CURDATE() para comparar apenas a data (dia/mês/ano), ignorando a hora.
    $stmtCheck = $conn->prepare("SELECT id FROM checkins WHERE user_id = ? AND event_id = ? AND DATE(checkin_time) = CURDATE()");
    $stmtCheck->execute([$userId, $eventId]);
    
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Você já marcou presença hoje!"]);
        exit;
    }

    // 3. Registra o novo check-in
    $stmt = $conn->prepare("INSERT INTO checkins (user_id, event_id) VALUES (?, ?)");
    
    if ($stmt->execute([$userId, $eventId])) {
        
        // Conta quantos check-ins totais o usuário já tem (Feedback visual)
        $count = $conn->query("SELECT COUNT(*) FROM checkins WHERE user_id = $userId AND event_id = $eventId")->fetchColumn();
        
        echo json_encode(["success" => true, "message" => "Presença Confirmada! (Dia $count)"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao salvar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>