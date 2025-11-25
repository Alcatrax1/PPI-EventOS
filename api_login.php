<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(["success" => false, "message" => "Dados incompletos."]);
    exit;
}

$email = $data['email'];
$password = $data['password'];

try {
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        
        unset($user['password']);
        
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "E-mail ou senha incorretos."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro no servidor."]);
}
?>