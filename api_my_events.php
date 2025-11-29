<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$user_id = $_GET['user_id'] ?? 0;

try {
    $sql = "SELECT e.*, en.id as enrollment_id, en.payment_status, en.enrolled_at
            FROM events e 
            JOIN enrollments en ON e.id = en.event_id 
            WHERE en.user_id = ? 
            ORDER BY e.date DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo json_encode([]);
}
?>