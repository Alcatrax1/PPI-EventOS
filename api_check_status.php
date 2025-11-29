<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require 'db_connect.php';
require 'config_mp.php';

$pid = $_GET['payment_id'] ?? null;

if (!$pid) {
    echo json_encode(['status' => 'error', 'message' => 'ID de pagamento faltando']);
    exit;
}


try {
    $stmtLocal = $conn->prepare("SELECT payment_status FROM enrollments WHERE payment_id = ?");
    $stmtLocal->execute([$pid]);
    $local = $stmtLocal->fetch(PDO::FETCH_ASSOC);

    if ($local && $local['payment_status'] === 'approved') {
        echo json_encode(['status' => 'approved']);
        exit; 
    }
} catch (Exception $e) {
}

$ch = curl_init('https://api.mercadopago.com/v1/payments/' . $pid);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . MP_ACCESS_TOKEN]);
$mp_res = json_decode(curl_exec($ch));
curl_close($ch);

$status = $mp_res->status ?? 'pending';

if ($status === 'approved') {
    $token = strtoupper(substr(md5(uniqid()), 0, 8));
    
    try {
        $stmt = $conn->prepare("UPDATE enrollments SET payment_status='approved', ticket_token=? WHERE payment_id=? AND payment_status != 'approved'");
        $stmt->execute([$token, $pid]);
        
        echo json_encode(['status'=>'approved', 'token'=>$token]);
    } catch (PDOException $e) {
        echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
    }
} else {
    echo json_encode(['status'=>$status]);
}
?>