-- Migración 003: corrige la columna `Tipo` de la tabla Notificaciones.
-- Si la tabla fue creada previamente con un ENUM incompleto o con otro tipo,
-- los INSERT con valores como 'evento_creado' pueden haber quedado guardados
-- como cadena vacía ''. Este script:
--   1. Elimina las filas inválidas (Tipo = '' o NULL).
--   2. Fuerza la definición correcta de las columnas clave con MODIFY COLUMN.
--
-- Es seguro ejecutarlo varias veces.

USE garage_manager;

-- 1. Limpiar notificaciones con Tipo inválido creadas antes del fix.
DELETE FROM Notificaciones
    WHERE Tipo IS NULL OR Tipo = '' OR Tipo NOT IN ('evento_creado', 'evento_proximo', 'informativa');

-- 2. Forzar la definición correcta de columnas.
ALTER TABLE Notificaciones
    MODIFY COLUMN BandaId INT NULL,
    MODIFY COLUMN EventoId INT NULL,
    MODIFY COLUMN Tipo ENUM('evento_creado', 'evento_proximo', 'informativa') NOT NULL,
    MODIFY COLUMN Titulo VARCHAR(180) NOT NULL,
    MODIFY COLUMN Mensaje VARCHAR(500) NULL,
    MODIFY COLUMN Leida TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
