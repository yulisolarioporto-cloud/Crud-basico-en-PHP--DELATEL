<?php

session_start();

if(!isset($_SESSION['id_usuario'])){

    header("Location: ../login.html");
    exit;
}


// Verificar que la librería FPDF esté disponible antes de continuar
$ruta_fpdf = __DIR__ . '/fpdf186/fpdf.php';

if (!file_exists($ruta_fpdf)) {
    header("Content-Type: text/html; charset=utf-8");
    echo "<h2 style='color:red; font-family:Arial;'>Error: Librería FPDF no encontrada.</h2>";
    echo "<p style='font-family:Arial;'>Por favor descarga FPDF desde <a href='http://www.fpdf.org' target='_blank'>www.fpdf.org</a> y coloca la carpeta <strong>fpdf/</strong> dentro de la carpeta <strong>php/</strong> del proyecto.</p>";
    exit;
}

include('../config/conexion.php');

require($ruta_fpdf);

$pdf = new FPDF();

$pdf->AddPage();

$pdf->SetFont('Arial','B',18);

$pdf->Cell(190,10,'REPORTE KARDEX DELATEL',0,1,'C');

$pdf->Ln(5);

$pdf->SetFont('Arial','',11);

$pdf->Cell(190,10,'Fecha: '.date('d/m/Y H:i:s'),0,1,'R');

$pdf->Ln(5);

$pdf->SetFont('Arial','B',10);

$pdf->Cell(15,10,'ID',1);

$pdf->Cell(45,10,'Producto',1);

$pdf->Cell(30,10,'Movimiento',1);

$pdf->Cell(20,10,'Cant.',1);

$pdf->Cell(25,10,'Saldo',1);

$pdf->Cell(30,10,'Precio',1);

$pdf->Cell(25,10,'Fecha',1);

$pdf->Ln();

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

$pdf->SetFont('Arial','',9);

while($row = mysqli_fetch_assoc($res)){

    $pdf->Cell(15,10,$row['id_kardex'],1);

    $pdf->Cell(45,10,utf8_decode($row['modelo']),1);

    $pdf->Cell(30,10,$row['tipo_movimiento'],1);

    $pdf->Cell(20,10,$row['cantidad'],1);

    $pdf->Cell(25,10,$row['saldo_total'],1);

    $pdf->Cell(30,10,'S/. '.$row['valor_unico_historico'],1);

    $pdf->Cell(25,10,date('d/m/Y', strtotime($row['fecha'])),1);

    $pdf->Ln();
}

$pdf->Output();
?>
