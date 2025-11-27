<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require 'db_connect.php';

if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "ID faltando."]);
    exit;
}

try {
    $id = $_POST['id'];
    $name = $_POST['name'];
    $desc = $_POST['description'];
    $dateTime = $_POST['date'] . ' ' . ($_POST['time'] ?? '00:00') . ':00';
    $loc = $_POST['location'];
    $price = $_POST['price'];
    $days = $_POST['required_checkins'];
    
    $capacity = $_POST['capacity'];

    $imgSql = "";
    $params = [$name, $desc, $dateTime, $loc, $price, $days, $capacity];

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = 'evt_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
            $imgSql = ", image_url = ?";
            $params[] = $uploadDir . $fileName;
        }
    }

    $params[] = $id; 

    $sql = "UPDATE events SET name=?, description=?, date=?, location=?, price=?, required_checkins=?, capacity=? $imgSql WHERE id=?";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>