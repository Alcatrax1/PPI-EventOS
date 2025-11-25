<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require 'db_connect.php';

try {
    $events = $conn->query("SELECT COUNT(*) FROM events")->fetchColumn();

    $checkins = $conn->query("SELECT COUNT(*) FROM checkins")->fetchColumn();

    $users = $conn->query("SELECT COUNT(*) FROM users")->fetchColumn();

    echo json_encode([
        "success" => true,
        "events" => $events,
        "checkins" => $checkins,
        "users" => $users
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erro BD"]);
}
?>