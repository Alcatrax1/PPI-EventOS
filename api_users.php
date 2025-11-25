<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require 'db_connect.php';

try {
    $stmt = $conn->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
} catch (PDOException $e) {
    echo json_encode([]);
}
?>