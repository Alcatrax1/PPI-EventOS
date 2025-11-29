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
    // --- Validação de Entradas Obrigatórias ---
    if (!isset($_POST['name']) || empty($_POST['name'])) {
        throw new Exception("O nome do evento é obrigatório.");
    }
    if (!isset($_POST['date']) || empty($_POST['date'])) {
        throw new Exception("A data do evento é obrigatória.");
    }

    // --- Coleta e Sanitização de Dados ---
    $name = $_POST['name'];
    $description = $_POST['description'] ?? '';
    
    $dateTime = $_POST['date'] . ' ' . ($_POST['time'] ?? '00:00') . ':00';

    $endTime = $_POST['end_time'] ?? '00:00'; 
    $capacity = $_POST['capacity'] ?? 50;
    $hours = $_POST['event_hours'] ?? 0;
    
    $location = $_POST['location'] ?? '';
    $price = $_POST['price'] ?? 0;
    $days = $_POST['required_checkins'] ?? 1;

    // --- Processamento do Upload da Imagem ---
    $imageUrl = ''; 
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['image'];
        $maxFileSize = 2 * 1024 * 1024; // 2MB
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

        // Validação de segurança do arquivo
        if ($file['size'] > $maxFileSize) {
            throw new Exception("O arquivo de imagem é muito grande (máximo 2MB).");
        }
        if (!in_array(mime_content_type($file['tmp_name']), $allowedMimeTypes)) {
            throw new Exception("Tipo de arquivo inválido. Apenas JPG, PNG e GIF são permitidos.");
        }

        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'evt_' . uniqid() . '.' . $ext;
        $targetFile = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            $imageUrl = $targetFile; 
        }
    }

    // --- Inserção no Banco de Dados ---
    $sql = "INSERT INTO events (name, description, date, end_time, location, price, image_url, required_checkins, capacity, event_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$name, $description, $dateTime, $endTime, $location, $price, $imageUrl, $days, $capacity, $hours]);

    echo json_encode(["success" => true, "message" => "Evento criado com sucesso!"]);

} catch (Exception $e) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>