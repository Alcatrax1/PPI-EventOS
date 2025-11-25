<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(["success" => false, "message" => "Preencha todos os campos."]);
    exit;
}

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];

try {
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Email já cadastrado!"]);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $role = ($email === 'admin@admin.com') ? 'admin' : 'user';

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$name, $email, $passwordHash, $role])) {
        $id = $conn->lastInsertId();
        echo json_encode([
            "success" => true, 
            "user" => [
                "id" => $id, 
                "name" => $name, 
                "email" => $email, 
                "role" => $role
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao salvar no banco."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>