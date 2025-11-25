<?php
require 'db_connect.php';

function describeTable($pdo, $table) {
    echo "\nTable: $table\n";
    echo "Field | Type | Null | Key | Default | Extra\n";
    echo "-------------------------------------------------\n";
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "{$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Key']} | {$row['Default']} | {$row['Extra']}\n";
        }
    } catch (PDOException $e) {
        echo "Error describing $table: " . $e->getMessage() . "\n";
    }
}

describeTable($conn, 'users');
describeTable($conn, 'events');
describeTable($conn, 'enrollments');
describeTable($conn, 'waitlist');
describeTable($conn, 'coupons');
?>
