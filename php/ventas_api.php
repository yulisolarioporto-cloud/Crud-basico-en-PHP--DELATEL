<?php
ob_start();
error_reporting(0);
session_start();

if (!isset($_SESSION['id_usuario'])) {
    ob_end_clean();
    header("Content-Type: application/json; charset=utf-8");
    die(json_encode(["error" => true, "mensaje" => "Acceso no autorizado"]));
}

ob_end_clean();
header("Content-Type: application/json; charset=utf-8");
include('../config/conexion.php');

$accion = isset($_GET['accion']) ? $_GET['accion'] : '';

function responder($error, $mensaje, $extra = []) {
    echo json_encode(array_merge(["error" => $error, "mensaje" => $mensaje], $extra));
    exit;
}

function registrarKardex($conexion, $id_producto, $tipo_movimiento, $cantidad, $saldo_total, $precio) {
    $stmt = $conexion->prepare("
        INSERT INTO tb_kardex(id_producto, id_almacen, accion, tipo_movimiento, cantidad, saldo_total, valor_unico_historico)
        VALUES(?, 1, 'VENTA', ?, ?, ?, ?)
    ");
    $stmt->bind_param("isiid", $id_producto, $tipo_movimiento, $cantidad, $saldo_total, $precio);
    $stmt->execute();
}

switch($accion) {
    case 'listar_paginado':
        $pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
        $buscar = isset($_GET['buscar']) ? trim($_GET['buscar']) : '';
        $limite = 12;
        $inicio = ($pagina - 1) * $limite;
        $buscar_like = "%$buscar%";

        $stmt_total = $conexion->prepare("SELECT COUNT(*) total FROM tb_productos WHERE se_vende = TRUE AND stock > 0 AND modelo LIKE ?");
        $stmt_total->bind_param("s", $buscar_like);
        $stmt_total->execute();
        $total_registros = intval($stmt_total->get_result()->fetch_assoc()['total']);
        $total_paginas = max(1, ceil($total_registros / $limite));

        $stmt = $conexion->prepare("SELECT id_producto, modelo, precio_actual AS precio, stock, imagen FROM tb_productos WHERE se_vende = TRUE AND stock > 0 AND modelo LIKE ? ORDER BY modelo ASC LIMIT ?, ?");
        $stmt->bind_param("sii", $buscar_like, $inicio, $limite);
        $stmt->execute();
        $productos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode(["error" => false, "productos" => $productos, "pagina_actual" => $pagina, "total_paginas" => $total_paginas]);
        break;

    case 'procesar_venta':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['carrito']) || empty($data['carrito'])) {
            responder(true, "Carrito vacío");
        }

        $carrito = $data['carrito'];
        $conexion->begin_transaction();

        try {
            $subtotal = 0;
            foreach ($carrito as $item) {
                $subtotal += floatval($item['precio']) * intval($item['cantidad']);
            }
            $igv = round($subtotal * 0.18, 2);
            $total = round($subtotal + $igv, 2);

            $stmt_venta = $conexion->prepare("INSERT INTO tb_ventas(titulo, subtotal, igv, total) VALUES('Venta POS', ?, ?, ?)");
            $stmt_venta->bind_param("ddd", $subtotal, $igv, $total);
            if (!$stmt_venta->execute()) throw new Exception("Error al registrar venta");

            $id_venta = $conexion->insert_id;

            foreach ($carrito as $item) {
                $id_producto = intval($item['id_producto']);
                $cantidad    = intval($item['cantidad']);
                $precio      = floatval($item['precio']);

                // Leer stock SIN FOR UPDATE para compatibilidad MyISAM/InnoDB
                $stmt_p = $conexion->prepare("SELECT stock, modelo FROM tb_productos WHERE id_producto = ?");
                $stmt_p->bind_param("i", $id_producto);
                $stmt_p->execute();
                $producto = $stmt_p->get_result()->fetch_assoc();

                if (!$producto) throw new Exception("Producto ID $id_producto no encontrado");
                if ($cantidad > intval($producto['stock'])) throw new Exception("Stock insuficiente para " . $producto['modelo']);

                $subtotal_det = round($precio * $cantidad, 2);
                $stmt_d = $conexion->prepare("INSERT INTO tb_detalle_venta(id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES(?, ?, ?, ?, ?)");
                $stmt_d->bind_param("iiidd", $id_venta, $id_producto, $cantidad, $precio, $subtotal_det);
                if (!$stmt_d->execute()) throw new Exception("Error al registrar detalle");

                $nuevo_stock = intval($producto['stock']) - $cantidad;
                $stmt_s = $conexion->prepare("UPDATE tb_productos SET stock = ? WHERE id_producto = ?");
                $stmt_s->bind_param("ii", $nuevo_stock, $id_producto);
                if (!$stmt_s->execute()) throw new Exception("Error al actualizar stock");

                registrarKardex($conexion, $id_producto, "SALIDA", $cantidad, $nuevo_stock, $precio);
            }

            $conexion->commit();
            responder(false, "Venta registrada correctamente", ["id_venta" => $id_venta, "total" => $total]);

        } catch (Exception $e) {
            $conexion->rollback();
            responder(true, $e->getMessage());
        }
        break;

    default:
        responder(true, "Acción no válida");
        break;
}
