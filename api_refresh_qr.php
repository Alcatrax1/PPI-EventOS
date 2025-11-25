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
    // 1. Gera um token aleatório único
    $token = bin2hex(random_bytes(16)); // Ex: a1b2c3d4...
    
    // 2. Define validade para 35 segundos (30s + 5s de tolerância para internet lenta)
    $expires = date('Y-m-d H:i:s', strtotime('+35 seconds'));

    // 3. Salva no banco
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