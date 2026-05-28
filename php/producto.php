<?php
// ── Seguridad: sesión obligatoria ──────────────────────────────────────────
session_start();

if (!isset($_SESSION['id_usuario'])) {
    header("Content-Type: application/json; charset=utf-8");
    http_response_code(401);
    echo json_encode(["error" => true, "mensaje" => "Acceso denegado"]);
    exit;
}

header("Content-Type: application/json; charset=utf-8");
include('../config/conexion.php');

date_default_timezone_set('America/Lima');

$accion = isset($_GET['accion'])
? trim($_GET['accion'])
: '';

$archivo_log = __DIR__ . "/logs_kardex.txt";

/*
|--------------------------------------------------------------------------
| FUNCIONES
|--------------------------------------------------------------------------
*/

function responder($error, $mensaje, $extra = []){

    echo json_encode(array_merge([
        "error" => $error,
        "mensaje" => $mensaje
    ], $extra));

    exit;
}

function limpiarTexto($texto, $max = 100){

    $texto = trim($texto);
    $texto = strip_tags($texto);
    $texto = htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');

    if(strlen($texto) > $max){
        $texto = substr($texto, 0, $max);
    }

    return $texto;
}

function registrarLog($archivo, $texto){

    @file_put_contents(
        $archivo,
        "[" . date('Y-m-d H:i:s') . "] " . $texto . PHP_EOL,
        FILE_APPEND
    );
}

function registrarHistorial($conexion, $id_producto, $accion, $descripcion){

    $stmt = $conexion->prepare("
    INSERT INTO historial(
        id_producto,
        accion,
        tabla_afectada,
        descripcion,
        usuario,
        modulo
    )
    VALUES(
        ?, ?, 'tb_productos', ?, ?, 'KARDEX'
    )
    ");

    $usuario = strval($_SESSION['id_usuario']);

    $stmt->bind_param(
        "isss",
        $id_producto,
        $accion,
        $descripcion,
        $usuario
    );

    $stmt->execute();
}

function registrarKardex(
    $conexion,
    $id_producto,
    $accion,
    $tipo_movimiento,
    $cantidad,
    $saldo_total,
    $precio
){

    $stmt = $conexion->prepare("
    INSERT INTO tb_kardex(
        id_producto,
        id_almacen,
        accion,
        tipo_movimiento,
        cantidad,
        saldo_total,
        valor_unico_historico
    )
    VALUES(
        ?, 1, ?, ?, ?, ?, ?
    )
    ");

    $stmt->bind_param(
        "issiid",
        $id_producto,
        $accion,
        $tipo_movimiento,
        $cantidad,
        $saldo_total,
        $precio
    );

    $stmt->execute();
}

function obtenerProductoPorId($conexion, $id){

    $stmt = $conexion->prepare("
    SELECT *
    FROM tb_productos
    WHERE id_producto = ?
    ");

    $stmt->bind_param("i", $id);

    $stmt->execute();

    return $stmt->get_result()->fetch_assoc();
}

function existeModeloActivo($conexion, $modelo, $idExcluir = 0){

    if($idExcluir > 0){

        $stmt = $conexion->prepare("
        SELECT id_producto
        FROM tb_productos
        WHERE modelo = ?
        AND se_vende = TRUE
        AND id_producto != ?
        ");

        $stmt->bind_param(
            "si",
            $modelo,
            $idExcluir
        );

    }else{

        $stmt = $conexion->prepare("
        SELECT id_producto
        FROM tb_productos
        WHERE modelo = ?
        AND se_vende = TRUE
        ");

        $stmt->bind_param(
            "s",
            $modelo
        );
    }

    $stmt->execute();

    return $stmt->get_result()->num_rows > 0;
}

/*
|--------------------------------------------------------------------------
| SWITCH PRINCIPAL
|--------------------------------------------------------------------------
*/

switch ($accion) {

    case 'historial_kardex':

        if (!file_exists($archivo_log)) {
            echo json_encode([]);
            exit;
        }

        $lineas = @file(
            $archivo_log,
            FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
        );

        echo json_encode(
            $lineas
            ? array_reverse($lineas)
            : []
        );

    break;


    case 'insertar':

        $data = json_decode(
            file_get_contents("php://input"),
            true
        );

        if(!$data){
            responder(true, "Datos inválidos");
        }

        $modelo = limpiarTexto($data["modelo"], 100);

        $precio = filter_var(
            $data["precio"],
            FILTER_VALIDATE_FLOAT
        );

        $stock = filter_var(
            $data["stock"],
            FILTER_VALIDATE_INT
        );

        if($modelo == ""){
            responder(true, "Modelo obligatorio");
        }

        if($precio === false || $precio <= 0){
            responder(true, "Precio inválido");
        }

        if($stock === false || $stock < 0){
            responder(true, "Stock inválido");
        }

        if(existeModeloActivo($conexion, $modelo)){
            responder(true, "El producto ya existe");
        }

        $stmt = $conexion->prepare("
        INSERT INTO tb_productos(
            modelo,
            precio_actual,
            stock,
            id_marca,
            id_tipo,
            id_unidad
        )
        VALUES(
            ?, ?, ?, 1, 1, 1
        )
        ");

        $stmt->bind_param(
            "sdi",
            $modelo,
            $precio,
            $stock
        );

        if($stmt->execute()){

            $id_producto = $conexion->insert_id;

            registrarKardex(
                $conexion,
                $id_producto,
                "INSERT",
                "ENTRADA",
                $stock,
                $stock,
                $precio
            );

            registrarHistorial(
                $conexion,
                $id_producto,
                "INSERT",
                "Producto registrado"
            );

            registrarLog(
                $archivo_log,
                "INSERT | ID: $id_producto | $modelo"
            );

            responder(
                false,
                "Producto registrado correctamente"
            );

        }else{

            registrarLog(
                $archivo_log,
                "ERROR INSERT: " . $stmt->error
            );

            responder(
                true,
                "Error al registrar producto"
            );
        }

    break;


    case 'actualizar':

        $data = json_decode(
            file_get_contents("php://input"),
            true
        );

        if(!$data){
            responder(true, "Datos inválidos");
        }

        $id = intval($data["id"]);

        $modelo = limpiarTexto($data["modelo"], 100);

        $precio = filter_var(
            $data["precio"],
            FILTER_VALIDATE_FLOAT
        );

        $stock_nuevo = filter_var(
            $data["stock"],
            FILTER_VALIDATE_INT
        );

        if($id <= 0){
            responder(true, "ID inválido");
        }

        if($modelo == ""){
            responder(true, "Modelo obligatorio");
        }

        if($precio === false || $precio <= 0){
            responder(true, "Precio inválido");
        }

        if($stock_nuevo === false || $stock_nuevo < 0){
            responder(true, "Stock inválido");
        }

        if(existeModeloActivo($conexion, $modelo, $id)){
            responder(true, "Ya existe otro producto");
        }

        $producto = obtenerProductoPorId(
            $conexion,
            $id
        );

        if(!$producto){
            responder(true, "Producto no encontrado");
        }

        $stock_anterior = intval($producto['stock']);

        $diferencia = $stock_nuevo - $stock_anterior;

        $stmt = $conexion->prepare("
        UPDATE tb_productos
        SET
            modelo = ?,
            precio_actual = ?,
            stock = ?,
            updated_at = NOW()
        WHERE id_producto = ?
        ");

        $stmt->bind_param(
            "sdii",
            $modelo,
            $precio,
            $stock_nuevo,
            $id
        );

        if($stmt->execute()){

            if($diferencia != 0){

                $tipo_movimiento =
                ($diferencia > 0)
                ? "ENTRADA"
                : "SALIDA";

                registrarKardex(
                    $conexion,
                    $id,
                    "UPDATE",
                    $tipo_movimiento,
                    abs($diferencia),
                    $stock_nuevo,
                    $precio
                );
            }

            registrarHistorial(
                $conexion,
                $id,
                "UPDATE",
                "Producto actualizado"
            );

            registrarLog(
                $archivo_log,
                "UPDATE | ID: $id | $modelo"
            );

            responder(
                false,
                "Producto actualizado correctamente"
            );

        }else{

            registrarLog(
                $archivo_log,
                "ERROR UPDATE: " . $stmt->error
            );

            responder(
                true,
                "Error al actualizar"
            );
        }

    break;


    case 'eliminar':

        $data = json_decode(
            file_get_contents("php://input"),
            true
        );

        $id = intval($data["id"]);

        if($id <= 0){
            responder(true, "ID inválido");
        }

        $producto = obtenerProductoPorId(
            $conexion,
            $id
        );

        if(!$producto){
            responder(true, "Producto no encontrado");
        }

        $stmt = $conexion->prepare("
        UPDATE tb_productos
        SET
            se_vende = FALSE,
            inactive_at = NOW()
        WHERE id_producto = ?
        ");

        $stmt->bind_param("i", $id);

        if($stmt->execute()){

            registrarHistorial(
                $conexion,
                $id,
                "DELETE",
                "Producto enviado a papelera"
            );

            registrarLog(
                $archivo_log,
                "DELETE | ID: $id"
            );

            responder(
                false,
                "Producto enviado a papelera"
            );

        }else{

            responder(
                true,
                "Error al eliminar"
            );
        }

    break;


    case 'reactivar':

        $data = json_decode(
            file_get_contents("php://input"),
            true
        );

        $id = intval($data["id"]);

        if($id <= 0){
            responder(true, "ID inválido");
        }

        $producto = obtenerProductoPorId(
            $conexion,
            $id
        );

        if(!$producto){
            responder(true, "Producto no encontrado");
        }

        if(
            existeModeloActivo(
                $conexion,
                $producto['modelo'],
                $id
            )
        ){
            responder(
                true,
                "Ya existe otro producto activo"
            );
        }

        $stmt = $conexion->prepare("
        UPDATE tb_productos
        SET
            se_vende = TRUE,
            inactive_at = NULL
        WHERE id_producto = ?
        ");

        $stmt->bind_param("i", $id);

        if($stmt->execute()){

            registrarHistorial(
                $conexion,
                $id,
                "UPDATE",
                "Producto reactivado"
            );

            registrarLog(
                $archivo_log,
                "REACTIVAR | ID: $id"
            );

            responder(
                false,
                "Producto reactivado correctamente"
            );

        }else{

            responder(
                true,
                "Error al reactivar"
            );
        }

    break;


    case 'listar':

        $estado = (
            isset($_GET['bajas']) &&
            $_GET['bajas'] == 'true'
        )
        ? 0
        : 1;

        $stmt = $conexion->prepare("
        SELECT
            id_producto,
            modelo,
            precio_actual,
            stock,
            imagen,
            created_at
        FROM tb_productos
        WHERE se_vende = ?
        ORDER BY id_producto DESC
        ");

        $stmt->bind_param(
            "i",
            $estado
        );

        $stmt->execute();

        $resultado = $stmt->get_result();

        $datos = [];

        while($fila = $resultado->fetch_assoc()){

            $fila['modelo'] = htmlspecialchars(
                $fila['modelo'],
                ENT_QUOTES,
                'UTF-8'
            );

            $datos[] = $fila;
        }

        echo json_encode($datos);

    break;


    default:

        responder(true, "Acción no válida");

    break;
}

?>