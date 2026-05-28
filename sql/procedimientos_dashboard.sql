USE TESTDELATEL;

DELIMITER //

CREATE PROCEDURE sp_dashboard_resumen()
BEGIN

    SELECT COUNT(*) productos
    FROM tb_productos
    WHERE se_vende = TRUE;

    SELECT COUNT(*) ventas
    FROM tb_ventas;

    SELECT
        id_producto,
        modelo,
        stock,
        precio_actual
    FROM tb_productos
    WHERE stock <= 5
    AND se_vende = TRUE
    ORDER BY stock ASC;

END //

DELIMITER ;