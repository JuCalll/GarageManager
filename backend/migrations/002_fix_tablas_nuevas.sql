-- Migración 002: asegura que Notificaciones y Redes_Sociales tengan el esquema
-- completo, incluso si fueron creadas previamente por create_all con un modelo
-- anterior. Todos los ALTER son idempotentes (IF NOT EXISTS).

USE garage_manager;

-- ----------------------------- Redes_Sociales -----------------------------
ALTER TABLE Redes_Sociales
    ADD COLUMN IF NOT EXISTS FechaCreacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP AFTER Url;

-- ----------------------------- Notificaciones -----------------------------
ALTER TABLE Notificaciones
    ADD COLUMN IF NOT EXISTS BandaId INT NULL AFTER UsuarioId,
    ADD COLUMN IF NOT EXISTS EventoId INT NULL AFTER BandaId,
    ADD COLUMN IF NOT EXISTS Tipo
        ENUM('evento_creado', 'evento_proximo', 'informativa') NOT NULL
        AFTER EventoId,
    ADD COLUMN IF NOT EXISTS Titulo VARCHAR(180) NOT NULL AFTER Tipo,
    ADD COLUMN IF NOT EXISTS Mensaje VARCHAR(500) NULL AFTER Titulo,
    ADD COLUMN IF NOT EXISTS Leida TINYINT(1) NOT NULL DEFAULT 0 AFTER Mensaje,
    ADD COLUMN IF NOT EXISTS FechaCreacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP AFTER Leida;

-- FKs sobre Notificaciones (solo si no existen).
SET @fk_banda := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Notificaciones'
      AND CONSTRAINT_NAME = 'fk_notif_banda'
);
SET @ddl := IF(@fk_banda = 0,
    'ALTER TABLE Notificaciones ADD CONSTRAINT fk_notif_banda FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_evento := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Notificaciones'
      AND CONSTRAINT_NAME = 'fk_notif_evento'
);
SET @ddl := IF(@fk_evento = 0,
    'ALTER TABLE Notificaciones ADD CONSTRAINT fk_notif_evento FOREIGN KEY (EventoId) REFERENCES Eventos(Id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_usuario := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Notificaciones'
      AND CONSTRAINT_NAME = 'fk_notif_usuario'
);
SET @ddl := IF(@fk_usuario = 0,
    'ALTER TABLE Notificaciones ADD CONSTRAINT fk_notif_usuario FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
