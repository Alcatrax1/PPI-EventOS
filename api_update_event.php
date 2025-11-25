<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php';

// Verifica se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método inválido."]);
    exit;
}

// Verifica se o ID veio (obrigatório para editar)
if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "ID do evento faltando."]);
    exit;
}

try {
    $id = $_POST['id'];
    $name = $_POST['name'];
    $desc = $_POST['description'] ?? '';
    
    // Formata Data e Hora
    $date = $_POST['date'];
    $time = $_POST['time'] ?? '00:00';
    $dateTime = $date . ' ' . $time . ':00';
    
    $loc = $_POST['location'] ?? '';
    $price = $_POST['price'] ?? 0;
    $days = $_POST['required_checkins'] ?? 1;

    // --- LÓGICA DE IMAGEM (Só atualiza se enviou uma nova) ---
    $imgSql = "";
    $params = [$name, $desc, $dateTime, $loc, $price, $days];

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        // Cria a pasta se não existir
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = 'evt_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        $targetFile = $uploadDir . $fileName;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            // Atualiza o SQL para mudar a imagem também
            $imgSql = ", image_url = ?";
            $params[] = $targetFile; // Salva caminho relativo (ex: uploads/foto.jpg)
        }
    }

    // O ID entra por último na lista de parâmetros para o WHERE
    $params[] = $id;

    // Monta o SQL
    $sql = "UPDATE events SET name=?, description=?, date=?, location=?, price=?, required_checkins=? $imgSql WHERE id=?";
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode(["success" => true, "message" => "Evento atualizado com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar banco."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro SQL: " . $e->getMessage()]);
}
?>