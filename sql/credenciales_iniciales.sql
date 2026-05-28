DELETE FROM tb_usuarios;

INSERT INTO tb_usuarios (nombres, usuario, correo, password, estado) VALUES
('Administrador', 'admin', 'admin@mail.com', '123', 'activo'),
('Yuliana Solar', 'yuliana', 'yuliana.solar.oporto@gmail.com', '123', 'activo'),
('Juan Perez', 'juanp', 'juan@mail.com', '123', 'activo');

-- 4. DATOS BÁSICOS
INSERT INTO tb_unidadmedida (nombre_unidad) VALUES ('Unidad'), ('Caja'), ('Paquete'), ('Docena');

INSERT INTO tb_marca (marca) VALUES
('Samsung'), ('Lenovo'), ('Apple'), ('Xiaomi'),
('HP'), ('Dell'), ('Asus'), ('Motorola');

INSERT INTO tb_tipoproducto (tipo_nombre) VALUES
('Laptop'), ('Celular'), ('Audifonos'), ('Tablet');

INSERT INTO tb_almacen (nombre_almacen, ubicacion, latitud, longitud) VALUES
('Delatel Chincha', 'Chincha Alta', -13.4187, -76.1324),
('Delatel Grocio Prado', 'Grocio Prado', -13.3985, -76.1572),
('Delatel Ica', 'Ica', -14.0678, -75.7286);

DELETE FROM tb_usuarios;

INSERT INTO tb_usuarios (nombres, usuario, correo, password, estado) VALUES
('Administrador', 'admin', 'admin@mail.com', '123', 'activo'),
('Yuliana Solar', 'yuliana', 'yuliana.solar.oporto@gmail.com', '123', 'activo'),
('Juan Perez', 'juanp', 'juan@mail.com', '123', 'activo');