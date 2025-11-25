<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php';

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Erro: O PHP não recebeu nenhum dado JSON.", "debug_raw" => $json]);
    exit;
}

$userId = $data['user_id'] ?? null;
$eventId = $data['event_id'] ?? null;

if (!$userId || !$eventId) {
    echo json_encode(["success" => false, "message" => "Erro: IDs faltando.", "debug_user" => $userId, "debug_event" => $eventId]);
    exit;
}

try {
    $stmtCheck = $conn->prepare("SELECT id FROM enrollments WHERE user_id = ? AND event_id = ?");
    $stmtCheck->execute([$userId, $eventId]);

    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Aviso: Você já está inscrito!"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO enrollments (user_id, event_id) VALUES (?, ?)");
    
    if($stmt->execute([$userId, $eventId])) {
        echo json_encode(["success" => true, "message" => "Sucesso: Salvo no banco!"]);
    } else {
        $err = $stmt->errorInfo();
        echo json_encode(["success" => false, "message" => "Erro ao gravar: " . $err[2]]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro Crítico SQL: " . $e->getMessage()]);
}

?>