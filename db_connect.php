<?php
$host = 'localhost';
$dbname = 'eventos_db';
$user = 'root';
$pass = ''; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["success" => false, "message" => "Erro Conexão: " . $e->getMessage()]));
}
?>