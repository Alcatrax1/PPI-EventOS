<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$user_id = $_GET['user_id'] ?? 0;
$event_id = $_GET['event_id'] ?? 0;

if (!$user_id || !$event_id) {
    echo json_encode(["success" => false, "message" => "Dados inválidos."]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT name, date, location, required_checkins FROM events WHERE id = ?");
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        echo json_encode(["success" => false, "message" => "Evento não encontrado."]);
        exit;
    }

    $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM checkins WHERE user_id = ? AND event_id = ?");
    $stmtCheck->execute([$user_id, $event_id]);
    $myCheckins = $stmtCheck->fetchColumn();

    $required = (int)$event['required_checkins'];
    if ($required <= 0) $required = 1; 

    $percentage = ($myCheckins / $required) * 100;
    
    $displayPercentage = $percentage > 100 ? 100 : $percentage;

    if ($percentage >= 75) {
        $code = strtoupper(substr(md5($user_id . $event_id . 'certificado2024'), 0, 16));
        $formattedCode = implode('-', str_split($code, 4));

        echo json_encode([
            "success" => true,
            "percentage" => round($displayPercentage),
            "data" => [
                "event_name" => $event['name'],
                "event_date" => date('d/m/Y', strtotime($event['date'])),
                "event_loc"  => $event['location'],
                "code" => $formattedCode
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "percentage" => round($displayPercentage),
            "debug_info" => "Você tem $myCheckins de $required presenças.",
            "message" => "Presença insuficiente."
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro interno."]);
}
?>