USE TESTDELATEL;

DELIMITER //

CREATE PROCEDURE sp_listar_productos()
BEGIN

    SELECT *
    FROM tb_productos
    WHERE se_vende = TRUE
    ORDER BY id_producto DESC;

END //

DELIMITER ;