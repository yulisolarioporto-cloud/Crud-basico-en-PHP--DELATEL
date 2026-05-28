USE TESTDELATEL;

INSERT INTO tb_unidadmedida (nombre_unidad)
VALUES
('Unidad'),
('Caja'),
('Paquete'),
('Docena');

INSERT INTO tb_marca (marca)
VALUES
('Samsung'),
('Lenovo'),
('Apple'),
('Xiaomi'),
('HP'),
('Dell'),
('Asus'),
('Motorola');

INSERT INTO tb_tipoproducto (tipo_nombre)
VALUES
('Laptop'),
('Celular'),
('Audifonos'),
('Tablet');

INSERT INTO tb_almacen (
    nombre_almacen,
    ubicacion,
    latitud,
    longitud
)
VALUES
('Delatel Chincha', 'Chincha Alta', -13.4187, -76.1324),
('Delatel Grocio Prado', 'Grocio Prado', -13.3985, -76.1572),
('Delatel Ica', 'Ica', -14.0678, -75.7286);

INSERT INTO descuentos (
    codigo,
    nombre,
    tipo_descuento,
    valor
)
VALUES
('DESC10', 'Descuento Primavera', 'PORCENTAJE', 10),
('DESC50', 'Descuento Fijo', 'MONTO FIJO', 50);

INSERT INTO tb_productos (
    modelo,
    precio_actual,
    codigo_barra,
    descripcion,
    stock,
    imagen,
    id_marca,
    id_tipo,
    id_unidad
)
VALUES
('Galaxy S24', 3500.00, '789456123', 'Celular Samsung Alta Gama', 50, 'image/S24.jpg', 1, 2, 1),

('ThinkPad X1', 6200.00, '963852741', 'Laptop Lenovo Empresarial', 20, 'image/ThinkPad.jpg', 2, 1, 1),

('iPhone 15 Pro', 5400.00, '159357456', 'Celular Apple 256GB', 18, 'image/iphone15pro.jpg', 3, 2, 1),

('Redmi Note 13', 1400.00, '258456789', 'Celular Xiaomi', 35, 'image/redmi13.jpg', 4, 2, 1),

('HP Pavilion Gaming', 4200.00, '456789123', 'Laptop HP Gamer', 12, 'image/hp_pavilion.jpg', 5, 1, 1),

('Dell Inspiron 15', 3900.00, '741852963', 'Laptop Dell Core i7', 8, 'image/dell_inspiron.jpg', 6, 1, 1),

('Asus VivoBook', 3100.00, '951753852', 'Laptop Asus Ryzen 5', 10, 'image/asus_vivobook.jpg', 7, 1, 1),

('Moto G84', 1300.00, '852147963', 'Celular Motorola', 25, 'image/motog84.jpg', 8, 2, 1),

('Galaxy Tab S9', 2800.00, '147258369', 'Tablet Samsung', 7, 'image/tabs9.jpg', 1, 4, 1),

('AirPods Pro 2', 1100.00, '369258147', 'Audifonos Apple', 30, 'image/airpods2.jpg', 3, 3, 1);

INSERT INTO tb_kardex (
    id_producto,
    id_almacen,
    accion,
    tipo_movimiento,
    cantidad,
    saldo_total,
    valor_unico_historico
)
VALUES
(1, 1, 'INSERT', 'ENTRADA', 50, 50, 3500.00),
(2, 1, 'INSERT', 'ENTRADA', 20, 20, 6200.00),
(3, 2, 'INSERT', 'ENTRADA', 18, 18, 5400.00),
(4, 2, 'INSERT', 'ENTRADA', 35, 35, 1400.00),
(5, 1, 'INSERT', 'ENTRADA', 12, 12, 4200.00),
(6, 3, 'INSERT', 'ENTRADA', 8, 8, 3900.00),
(7, 3, 'INSERT', 'ENTRADA', 10, 10, 3100.00),
(8, 1, 'INSERT', 'ENTRADA', 25, 25, 1300.00),
(9, 2, 'INSERT', 'ENTRADA', 7, 7, 2800.00),
(10, 1, 'INSERT', 'ENTRADA', 30, 30, 1100.00);

INSERT INTO tb_ventas (
    titulo,
    subtotal,
    igv,
    total,
    id_descuento
)
VALUES
('Venta Galaxy S24', 3500.00, 630.00, 4130.00, 1),

('Venta ThinkPad X1', 6200.00, 1116.00, 7316.00, 1),

('Venta AirPods', 1100.00, 198.00, 1298.00, 2),

('Venta Redmi Note 13', 1400.00, 252.00, 1652.00, 1);

INSERT INTO tb_detalle_venta (
    id_venta,
    id_producto,
    cantidad,
    precio_unitario,
    subtotal
)
VALUES
(1, 1, 1, 3500.00, 3500.00),
(2, 2, 1, 6200.00, 6200.00),
(3, 10, 1, 1100.00, 1100.00),
(4, 4, 1, 1400.00, 1400.00);

INSERT INTO historial (
    id_producto,
    accion,
    tabla_afectada,
    descripcion,
    usuario,
    modulo
)
VALUES
(1, 'INSERT', 'tb_productos', 'Producto registrado', 'admin', 'productos'),

(2, 'UPDATE', 'tb_productos', 'Actualización de stock', 'admin', 'productos'),

(3, 'DELETE', 'tb_productos', 'Producto enviado a papelera', 'admin', 'productos'),

(4, 'UPDATE', 'tb_productos', 'Cambio de precio', 'admin', 'ventas');