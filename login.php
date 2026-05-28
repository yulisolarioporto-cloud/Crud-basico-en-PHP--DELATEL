<?php
session_start();

header('Content-Type: application/json; charset=utf-8');
include('./config/conexion.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$user = trim($data['usuario']  ?? '');
$pass = trim($data['password'] ?? '');

if (!$user || !$pass) {
    echo json_encode(['error' => true, 'mensaje' => 'Campos requeridos']);
    exit;
}

$stmt = $conexion->prepare(
    "SELECT id_usuario, password FROM tb_usuarios WHERE usuario = ? AND estado = 'activo' LIMIT 1"
);
$stmt->bind_param("s", $user);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();

if ($res && $pass === $res['password']) {
    // Regenerar ID de sesión para prevenir session fixation
    session_regenerate_id(true);
    $_SESSION['id_usuario'] = $res['id_usuario'];
    echo json_encode(['error' => false, 'mensaje' => 'Bienvenido']);
} else {
    echo json_encode(['error' => true, 'mensaje' => 'Usuario o contraseña incorrectos']);
}
