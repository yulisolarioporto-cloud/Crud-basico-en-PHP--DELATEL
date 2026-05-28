-- 1. Crear Base de Datos
DROP DATABASE IF EXISTS TESTDELATEL;
CREATE DATABASE TESTDELATEL;
USE TESTDELATEL;

-- 2. Tablas
CREATE TABLE tb_usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    correo VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    created_at DATETIME DEFAULT NOW()
);

CREATE TABLE tb_unidadmedida (
    id_unidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_unidad VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tb_marca (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tb_tipoproducto (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    tipo_nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tb_almacen (
    id_almacen INT AUTO_INCREMENT PRIMARY KEY,
    nombre_almacen VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8)
);

CREATE TABLE descuentos (
    id_descuento INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20),
    nombre VARCHAR(50),
    tipo_descuento VARCHAR(20),
    valor DECIMAL(10,2)
);

CREATE TABLE tb_productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    precio_actual DECIMAL(10,2) NOT NULL,
    codigo_barra VARCHAR(50),
    descripcion TEXT,
    stock INT DEFAULT 0,
    se_vende BOOLEAN DEFAULT TRUE,
    id_marca INT,
    id_tipo INT,
    id_unidad INT,
    imagen VARCHAR(255),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    inactive_at DATETIME DEFAULT NULL,
    FOREIGN KEY (id_marca) REFERENCES tb_marca(id_marca),
    FOREIGN KEY (id_tipo) REFERENCES tb_tipoproducto(id_tipo),
    FOREIGN KEY (id_unidad) REFERENCES tb_unidadmedida(id_unidad)
);

CREATE TABLE tb_kardex (
    id_kardex INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_almacen INT NOT NULL,
    accion VARCHAR(20),
    tipo_movimiento ENUM('ENTRADA','SALIDA') NOT NULL,
    cantidad INT NOT NULL,
    saldo_total INT NOT NULL,
    valor_unico_historico DECIMAL(10,2),
    fecha DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_producto) REFERENCES tb_productos(id_producto),
    FOREIGN KEY (id_almacen) REFERENCES tb_almacen(id_almacen)
);

CREATE TABLE tb_ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    fecha DATETIME DEFAULT NOW(),
    subtotal DECIMAL(10,2),
    igv DECIMAL(10,2),
    total DECIMAL(10,2),
    id_descuento INT,
    FOREIGN KEY (id_descuento) REFERENCES descuentos(id_descuento)
);

CREATE TABLE tb_detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT,
    id_producto INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2)
);

CREATE TABLE historial (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    accion VARCHAR(20),
    tabla_afectada VARCHAR(50),
    descripcion TEXT,
    usuario VARCHAR(50),
    modulo VARCHAR(50),
    fecha DATETIME DEFAULT NOW()
);

ALTER TABLE tb_productos
  ADD COLUMN created_at  DATETIME DEFAULT NOW(),
  ADD COLUMN updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW(),
  ADD COLUMN inactive_at DATETIME DEFAULT NULL;