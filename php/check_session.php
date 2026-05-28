<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['autenticado' => false]);
    exit;
}
echo json_encode(['autenticado' => true]);
