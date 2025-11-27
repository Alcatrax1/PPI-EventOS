<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método inválido."]);
    exit;
}

try {
    $name = $_POST['name'];
    $description = $_POST['description'] ?? '';
    $dateTime = $_POST['date'] . ' ' . ($_POST['time'] ?? '00:00') . ':00';
    $location = $_POST['location'] ?? '';
    $price = $_POST['price'] ?? 0;
    $days = $_POST['required_checkins'] ?? 1;
    
    // NOVO: Recebe a capacidade
    $capacity = $_POST['capacity'] ?? 50; 

    // Lógica de Imagem (Mantida igual)
    $imageUrl = ''; 
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = 'evt_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
            $imageUrl = $uploadDir . $fileName; 
        }
    }

    // SQL ATUALIZADO com 'capacity'
    $stmt = $conn->prepare("INSERT INTO events (name, description, date, location, price, image_url, required_checkins, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([$name, $description, $dateTime, $location, $price, $imageUrl, $days, $capacity]);

    echo json_encode(["success" => true, "message" => "Evento criado!"]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>