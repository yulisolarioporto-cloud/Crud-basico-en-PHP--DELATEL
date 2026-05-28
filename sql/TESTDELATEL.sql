USE TESTDELATEL;

SELECT * FROM tb_productos;
SELECT * FROM tb_ventas;
SELECT * FROM tb_kardex;
SELECT * FROM historial;

CALL sp_listar_productos();
CALL sp_total_productos_busqueda('Samsung');
CALL sp_dashboard_resumen();