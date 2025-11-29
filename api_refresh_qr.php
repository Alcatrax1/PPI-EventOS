<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$event_id = $data['event_id'] ?? 0;

if (!$event_id) {
    echo json_encode(["success" => false]);
    exit;
}

try {
    $token = bin2hex(random_bytes(16)); 
    
    $expires = date('Y-m-d H:i:s', strtotime('+35 seconds'));

   
    $stmt = $conn->prepare("UPDATE events SET qr_token = ?, qr_expires_at = ? WHERE id = ?");
    $stmt->execute([$token, $expires, $event_id]);

    echo json_encode([
        "success" => true, 
        "token" => $token,
        "expires" => $expires
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>