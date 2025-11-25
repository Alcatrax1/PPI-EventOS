<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require 'db_connect.php';
require 'config_mp.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->event_id)) {
    echo json_encode(['success'=>false, 'message'=>'Dados incompletos']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT e.name, e.price, u.email, u.name as username FROM events e, users u WHERE e.id = ? AND u.id = ?");
    $stmt->execute([$data->event_id, $data->user_id]);
    $info = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$info) { echo json_encode(['success'=>false, 'message'=>'Erro ao buscar dados']); exit; }
    
    $price = (float)$info['price'];

    $curl = curl_init();
    
    $payload = [
        "transaction_amount" => $price,
        "description" => "Ingresso: " . $info['name'],
        "payment_method_id" => "pix",
        "payer" => [
            "email" => $info['email'], 
            "first_name" => $info['username']
        ]
    ];

    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.mercadopago.com/v1/payments',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
            'X-Idempotency-Key: ' . uniqid()
        ],
    ]);
    
    $raw_response = curl_exec($curl); 
    $response = json_decode($raw_response);
    curl_close($curl);

    if (isset($response->id)) {
        $qr = $response->point_of_interaction->transaction_data->qr_code;
        $img = $response->point_of_interaction->transaction_data->qr_code_base64;
        $pid = $response->id;

        $check = $conn->prepare("SELECT id FROM enrollments WHERE user_id=? AND event_id=?");
        $check->execute([$data->user_id, $data->event_id]);

        if($check->rowCount() > 0) {
            $sql = "UPDATE enrollments SET payment_id=?, pix_code=?, payment_status='pending' WHERE user_id=? AND event_id=?";
            $conn->prepare($sql)->execute([$pid, $qr, $data->user_id, $data->event_id]);
        } else {
            $sql = "INSERT INTO enrollments (user_id, event_id, payment_id, pix_code, payment_status) VALUES (?, ?, ?, ?, 'pending')";
            $conn->prepare($sql)->execute([$data->user_id, $data->event_id, $pid, $qr]);
        }
        
        echo json_encode(['success'=>true, 'payment_id'=>$pid, 'qr_code'=>$qr, 'qr_img'=>$img, 'amount'=>$price]);
    } else {
       
        $erro_detalhe = isset($response->message) ? $response->message : $raw_response;
        
        if(isset($response->cause) && is_array($response->cause) && count($response->cause) > 0) {
            $erro_detalhe .= " - " . $response->cause[0]->description;
        }

        echo json_encode(['success'=>false, 'message'=>'MP Recusou: ' . $erro_detalhe]);
    }

} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
?>