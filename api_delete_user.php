<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "ID não fornecido."]);
    exit;
}

if ($data['id'] == 1) {
    echo json_encode(["success" => false, "message" => "Você não pode apagar o Super Admin."]);
    exit;
}

try {
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    
    if ($stmt->execute([$data['id']])) {
        echo json_encode(["success" => true, "message" => "Usuário excluído com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao excluir."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>