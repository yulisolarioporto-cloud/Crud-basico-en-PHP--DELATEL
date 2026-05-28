<?php
// ── session_start() DEBE ir antes de cualquier otra instrucción ────────────
session_start();

header('Content-Type: application/json; charset=utf-8');
require_once('../config/conexion.php');

// Solo acepta POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
    exit;
}

$usuario  = trim($_POST['usuario']  ?? '');
$password = trim($_POST['password'] ?? '');

if (!$usuario || !$password) {
    echo json_encode(['error' => true, 'mensaje' => 'Campos requeridos']);
    exit;
}

$stmt = $conexion->prepare(
    "SELECT id_usuario, password FROM tb_usuarios WHERE usuario = ? AND estado = 'activo' LIMIT 1"
);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();

if ($res && $password === $res['password']) {
    // Regenerar ID de sesión para prevenir session fixation
    session_regenerate_id(true);
    $_SESSION['id_usuario'] = $res['id_usuario'];
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Usuario o contraseña incorrectos']);
}
