<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['new_role'])) {
    echo json_encode(["success" => false, "message" => "Dados incompletos."]);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
    if ($stmt->execute([$data['new_role'], $data['user_id']])) {
        echo json_encode(["success" => true, "message" => "Permissão alterada com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>