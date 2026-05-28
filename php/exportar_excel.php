<?php
ob_start();
error_reporting(0);

session_start();

if(!isset($_SESSION['id_usuario'])){

    header("Location: ../login.html");
    exit;
}


include('../config/conexion.php');

header("Content-Type: application/xls");
header("Content-Disposition: attachment; filename=kardex.xls");

echo "ID\tProducto\tMovimiento\tCantidad\tSaldo\tPrecio\tFecha\n";

$sql = "
SELECT 
p.modelo,
k.*
FROM tb_kardex k
INNER JOIN tb_productos p
ON k.id_producto = p.id_producto
ORDER BY k.fecha DESC
";

$res = mysqli_query($conexion, $sql);

while($row = mysqli_fetch_assoc($res)){

    echo
    $row['id_kardex']."\t".
    $row['modelo']."\t".
    $row['tipo_movimiento']."\t".
    $row['cantidad']."\t".
    $row['saldo_total']."\t".
    $row['valor_unico_historico']."\t".
    $row['fecha']."\n";
}
?>