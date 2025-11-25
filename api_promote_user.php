<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'conexao.php';


$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["success" => false, "message" => "ID do usuário não fornecido."]);
    exit;
}

$user_id = (int)$data->user_id;

$stmt = $conn->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Usuário promovido com sucesso."]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao atualizar o usuário: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>