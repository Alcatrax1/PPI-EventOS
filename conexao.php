<?php
$host = 'localhost';
$user = 'root';
$pass = '';       
$db   = 'eventos_db';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Erro DB: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>