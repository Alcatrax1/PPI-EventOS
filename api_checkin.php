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
    $stmtEvent = $conn->prepare("SELECT date, end_date, qr_token, qr_expires_at FROM events WHERE id = ?");
    $stmtEvent->execute([$eventId]);
    $event = $stmtEvent->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        echo json_encode(["success" => false, "message" => "Evento não encontrado."]);
        exit;
    }

    $agora = new DateTime();
    $inicio = new DateTime($event['date']);
    $fim = new DateTime($event['end_date']);

    if ($agora < $inicio) {
        echo json_encode(["success" => false, "message" => "Calma! O evento ainda não começou."]);
        exit;
    }

    if ($agora > $fim) {
        echo json_encode(["success" => false, "message" => "O evento já encerrou."]);
        exit;
    }

    if ($event['qr_token'] !== $tokenRecebido || new DateTime($event['qr_expires_at']) < $agora) {
        echo json_encode(["success" => false, "message" => "QR Code expirado! O organizador precisa atualizar a tela."]);
        exit;
    }

    $stmtCheck = $conn->prepare("SELECT id FROM checkins WHERE user_id = ? AND event_id = ? AND DATE(checkin_time) = CURDATE()");
    $stmtCheck->execute([$userId, $eventId]);
    
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Você já marcou presença hoje!"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO checkins (user_id, event_id) VALUES (?, ?)");
    if ($stmt->execute([$userId, $eventId])) {
        $count = $conn->query("SELECT COUNT(*) FROM checkins WHERE user_id = $userId AND event_id = $eventId")->fetchColumn();
        echo json_encode(["success" => true, "message" => "Presença Confirmada! (Dia $count)"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao salvar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro: " . $e->getMessage()]);
}
?>