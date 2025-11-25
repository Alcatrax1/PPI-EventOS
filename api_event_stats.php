<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require 'db_connect.php';

$eventId = $_GET['event_id'] ?? null;

if (!$eventId) {
    echo json_encode([]);
    exit;
}

try {
    $stmtTotal = $conn->prepare("SELECT COUNT(*) as total FROM checkins WHERE event_id = ?");
    $stmtTotal->execute([$eventId]);
    $total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];

    $sql = "SELECT DATE(checkin_time) as date, COUNT(*) as count 
            FROM checkins 
            WHERE event_id = ? 
            GROUP BY DATE(checkin_time) 
            ORDER BY date DESC LIMIT 7";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$eventId]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "total" => $total,
        "history" => $history
    ]);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>