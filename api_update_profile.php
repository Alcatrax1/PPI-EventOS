<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['name'])) {
    echo json_encode(["success" => false, "message" => "Dados incompletos."]);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE users SET name = ? WHERE id = ?");
    
    if ($stmt->execute([$data['name'], $data['user_id']])) {
        echo json_encode(["success" => true, "message" => "Perfil atualizado!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>