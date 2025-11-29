<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

try {
    if (!isset($_POST['id'])) {
        echo json_encode(["success" => false, "message" => "ID faltando."]);
        exit;
    }

    $id = $_POST['id'];
    $name = $_POST['name'];
    $desc = $_POST['description'];
    
    $dateTime = $_POST['date'] . ' ' . ($_POST['time'] ?? '00:00') . ':00';
    
   
    $endDate = !empty($_POST['end_date']) ? $_POST['end_date'] : $_POST['date'];
    $endTime = !empty($_POST['end_time']) ? $_POST['end_time'] : null;
    $capacity = !empty($_POST['capacity']) ? $_POST['capacity'] : null;
    $hours = !empty($_POST['event_hours']) ? $_POST['event_hours'] : 0;

    $loc = $_POST['location'];
    $price = $_POST['price'];
    $days = $_POST['required_checkins'];

    $params = [
        $name, 
        $desc, 
        $dateTime, 
        $endDate,   
        $endTime,   
        $loc, 
        $price, 
        $capacity,  
        $days,
        $hours      
    ];

    $imgSql = "";

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = 'evt_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $fullUrl = "$protocol://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/uploads/" . $fileName;
            
            $imgSql = ", image_url = ?";
            $params[] = $fullUrl;
        }
    }

    $params[] = $id; 

    $sql = "UPDATE events SET 
                name=?, 
                description=?, 
                date=?, 
                end_date=?, 
                end_time=?, 
                location=?, 
                price=?, 
                capacity=?, 
                required_checkins=?, 
                event_hours=? 
                $imgSql 
            WHERE id=?";
            
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro SQL ao atualizar."]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro de Banco: " . $e->getMessage()]);
}
?>