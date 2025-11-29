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
    $stmt = $conn->prepare("SELECT name, date, location, required_checkins, event_hours FROM events WHERE id = ?");
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        echo json_encode(["success" => false, "message" => "Evento não encontrado."]);
        exit;
    }

    $stmtCheck = $conn->prepare("SELECT COUNT(*) FROM checkins WHERE user_id = ? AND event_id = ?");
    $stmtCheck->execute([$user_id, $event_id]);
    $myCheckins = $stmtCheck->fetchColumn();

    $totalDias = (int)$event['required_checkins'];
    if ($totalDias <= 0) $totalDias = 1; 

    $porcentagem = ($myCheckins / $totalDias) * 100;
    
    $porcentagemVisual = round($porcentagem);
    if($porcentagemVisual > 100) $porcentagemVisual = 100;

    if ($porcentagem >= 75) {
        $code = strtoupper(substr(md5($user_id . $event_id . 'certificado'), 0, 16));
        $formattedCode = implode('-', str_split($code, 4));

        echo json_encode([
            "success" => true,
            "percentage" => $porcentagemVisual,
            "data" => [
                "event_name" => $event['name'],
                "event_date" => date('d/m/Y', strtotime($event['date'])),
                "event_loc"  => $event['location'],
                "event_hours" => $event['event_hours'] ?? 0, 
                "code" => $formattedCode
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "percentage" => $porcentagemVisual,
            "debug_info" => "Você tem $myCheckins de $totalDias presenças.",
            "message" => "Presença insuficiente para o certificado."
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro interno."]);
}
?>