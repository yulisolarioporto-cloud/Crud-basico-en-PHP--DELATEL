<?php
// ── Seguridad: sesión obligatoria ──────────────────────────────────────────
session_start();

if (!isset($_SESSION['id_usuario'])) {
    header("Content-Type: application/json; charset=utf-8");
    http_response_code(401);
    echo json_encode(["error" => true, "mensaje" => "Acceso no autorizado"]);
    exit;
}

header("Content-Type: application/json; charset=utf-8");
include('../config/conexion.php');

$buscar      = isset($_GET['buscar']) ? trim($_GET['buscar']) : '';
$buscarParam = '%' . $buscar . '%';

$stmt = $conexion->prepare("
SELECT
    k.id_kardex,
    p.modelo,
    k.accion,
    k.tipo_movimiento,
    k.cantidad,
    k.saldo_total,
    k.valor_unico_historico,
    k.fecha
FROM tb_kardex k
INNER JOIN tb_productos p ON k.id_producto = p.id_producto
WHERE p.modelo LIKE ?
ORDER BY k.fecha DESC
LIMIT 200
");

$stmt->bind_param('s', $buscarParam);
$stmt->execute();

$datos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode($datos);
