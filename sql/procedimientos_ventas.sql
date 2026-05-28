USE TESTDELATEL;

DELIMITER //

CREATE PROCEDURE sp_listar_ventas_paginado(
    IN p_inicio INT,
    IN p_limite INT,
    IN p_buscar VARCHAR(100)
)
BEGIN

    SELECT
        id_producto id,
        modelo,
        precio_actual precio,
        stock,
        imagen
    FROM tb_productos
    WHERE se_vende = TRUE
    AND modelo LIKE CONCAT('%', p_buscar, '%')
    ORDER BY id_producto DESC
    LIMIT p_inicio, p_limite;

END //

CREATE PROCEDURE sp_total_productos_busqueda(
    IN p_buscar VARCHAR(100)
)
BEGIN

    SELECT COUNT(*) total
    FROM tb_productos
    WHERE se_vende = TRUE
    AND modelo LIKE CONCAT('%', p_buscar, '%');

END //

DELIMITER ;