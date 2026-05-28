<?php
// ── Seguridad ──────────────────────────────────────────────────────────────
ob_start();
session_start();

if (!isset($_SESSION['id_usuario'])) {
    ob_end_clean();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(401);
    die(json_encode(["error" => true, "mensaje" => "No autorizado"]));
}

ob_end_clean();
header("Content-Type: application/json; charset=utf-8");
include('./config/conexion.php');

$total_productos = 0;
$total_ventas    = 0;
$stock_bajo      = 0;
$ventas_hoy      = 0;
$productos_bajos = [];
$grafico         = [];

// Total productos activos
$row = mysqli_fetch_assoc(mysqli_query($conexion,
    "SELECT COUNT(*) total FROM tb_productos WHERE se_vende = TRUE"
));
$total_productos = intval($row['total']);

// Ingresos totales (todas las ventas)
$row = mysqli_fetch_assoc(mysqli_query($conexion,
    "SELECT IFNULL(SUM(total), 0) total FROM tb_ventas"
));
$total_ventas = floatval($row['total']);

// Stock bajo (≤5 unidades)
$res = mysqli_query($conexion,
    "SELECT modelo, stock FROM tb_productos
     WHERE stock <= 5 AND se_vende = TRUE
     ORDER BY stock ASC"
);
while ($fila = mysqli_fetch_assoc($res)) {
    $productos_bajos[] = $fila;
}
$stock_bajo = count($productos_bajos);

// Ventas de hoy (conteo de registros)
$row = mysqli_fetch_assoc(mysqli_query($conexion,
    "SELECT COUNT(*) total FROM tb_ventas WHERE DATE(fecha) = CURDATE()"
));
$ventas_hoy = intval($row['total']);

// ── CORRECCIÓN: últimos 7 días ordenados correctamente ─────────────────────
// ORDER BY fecha DESC + LIMIT 7 captura los 7 días más recientes,
// luego se invierte para que el gráfico fluya cronológicamente (izq→der).
$res = mysqli_query($conexion,
    "SELECT DATE(fecha) fecha, SUM(total) total
     FROM tb_ventas
     GROUP BY DATE(fecha)
     ORDER BY fecha DESC
     LIMIT 7"
);
$filas = [];
while ($fila = mysqli_fetch_assoc($res)) {
    $filas[] = $fila;
}
// Invertir: de más reciente→más antiguo  a  más antiguo→más reciente
$grafico = array_reverse($filas);

echo json_encode([
    "error"           => false,
    "total_productos" => $total_productos,
    "total_ventas"    => $total_ventas,
    "stock_bajo"      => $stock_bajo,
    "ventas_hoy"      => $ventas_hoy,
    "productos_bajos" => $productos_bajos,
    "grafico"         => $grafico,
]);
