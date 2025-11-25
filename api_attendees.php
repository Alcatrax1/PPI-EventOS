<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

$event_id = $_GET['event_id'] ?? 0;

if(!$event_id) { echo json_encode([]); exit; }

try {
    $sql = "SELECT 
                u.id as user_id,
                u.name, 
                u.email, 
                en.enrolled_at,
                en.payment_status, 
                e.required_checkins,
                (SELECT COUNT(*) FROM checkins c WHERE c.user_id = u.id AND c.event_id = ?) as checkin_count
            FROM enrollments en
            JOIN users u ON en.user_id = u.id
            JOIN events e ON en.event_id = e.id
            WHERE en.event_id = ?
            ORDER BY en.payment_status ASC, u.name ASC"; 

    $stmt = $conn->prepare($sql);
    $stmt->execute([$event_id, $event_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>