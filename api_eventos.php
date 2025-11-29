<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

try {
   
    $sql = "SELECT e.*, 
            (SELECT COUNT(*) FROM enrollments WHERE event_id = e.id) as enrolled_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE event_id = e.id) as avg_rating
            FROM events e 
            ORDER BY e.date ASC";
            
    $stmt = $conn->query($sql);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($events);
} catch (PDOException $e) {
    echo json_encode([]);
}
?>