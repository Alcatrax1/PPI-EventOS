<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['event_id'])) {
    echo json_encode(["success" => false, "message" => "Dados inválidos."]);
    exit;
}

try {
    $stmt = $conn->prepare("DELETE FROM enrollments WHERE user_id = ? AND event_id = ?");
    
    if ($stmt->execute([$data['user_id'], $data['event_id']])) {
        $stmtCheck = $conn->prepare("DELETE FROM checkins WHERE user_id = ? AND event_id = ?");
        $stmtCheck->execute([$data['user_id'], $data['event_id']]);

        echo json_encode(["success" => true, "message" => "Inscrição cancelada."]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao cancelar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>