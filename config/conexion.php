<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$conexion = new mysqli("localhost", "root", "", "TESTDELATEL");
$conexion->set_charset("utf8");

if ($conexion->connect_error) {
    die(json_encode(["error" => true, "mensaje" => "Error de conexión"]));
}
?>