<?php
// teste_banco.php
$host = 'localhost';
$user = 'root';
$pass = ''; 
$db   = 'eventos_app';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ ERRO FATAL: " . $conn->connect_error);
}
echo "✅ SUCESSO! O PHP conectou no banco 'eventos_app'.";
?>