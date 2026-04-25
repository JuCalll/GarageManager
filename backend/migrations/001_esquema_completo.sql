-- Migración 001: alinea esquema existente con el modelo definitivo del PDF.
-- Aplica ALTER idempotentes sobre tablas que ya pueden existir.
-- Ejecutar desde phpMyAdmin o `mysql -u root garage_manager < 001_esquema_completo.sql`.

USE garage_manager;

-- ----------------------------- Bandas -----------------------------
ALTER TABLE Bandas
    ADD COLUMN IF NOT EXISTS Descripcion TEXT AFTER Ciudad,
    ADD COLUMN IF NOT EXISTS PortadaUrl VARCHAR(255) AFTER Descripcion;

-- ----------------------------- Miembros_Bandas -----------------------------
ALTER TABLE Miembros_Bandas
    ADD COLUMN IF NOT EXISTS EsAdministrador TINYINT(1) NOT NULL DEFAULT 0 AFTER Rol;

-- Marcar como administrador al miembro más antiguo de cada banda si nadie lo es.
UPDATE Miembros_Bandas mb
JOIN (
    SELECT BandaId, MIN(Id) AS PrimerMiembroId
    FROM Miembros_Bandas
    GROUP BY BandaId
) primeros ON primeros.PrimerMiembroId = mb.Id
SET mb.EsAdministrador = 1
WHERE NOT EXISTS (
    SELECT 1 FROM Miembros_Bandas mb2
    WHERE mb2.BandaId = mb.BandaId AND mb2.EsAdministrador = 1
);

-- ----------------------------- Eventos -----------------------------
ALTER TABLE Eventos
    ADD COLUMN IF NOT EXISTS Notas TEXT AFTER ContactoOrganizador;

-- ----------------------------- Finanzas -----------------------------
ALTER TABLE Finanzas
    ADD COLUMN IF NOT EXISTS UsuarioPagoId INT NULL AFTER EventoId,
    ADD COLUMN IF NOT EXISTS Categoria
        ENUM('transporte', 'sonido', 'equipos', 'promocion', 'otros') NULL
        AFTER Tipo,
    ADD COLUMN IF NOT EXISTS Estado
        ENUM('pendiente', 'cobrado', 'reembolsado') NOT NULL DEFAULT 'cobrado'
        AFTER Categoria;

-- FK opcional (ignora error si ya existe).
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Finanzas'
      AND CONSTRAINT_NAME = 'fk_finanzas_usuario_pago'
);
SET @ddl := IF(@fk_exists = 0,
    'ALTER TABLE Finanzas ADD CONSTRAINT fk_finanzas_usuario_pago FOREIGN KEY (UsuarioPagoId) REFERENCES Usuarios(Id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------- Notas -----------------------------
ALTER TABLE Notas
    ADD COLUMN IF NOT EXISTS Fijada TINYINT(1) NOT NULL DEFAULT 0 AFTER Contenido;

-- ----------------------------- Redes_Sociales -----------------------------
CREATE TABLE IF NOT EXISTS Redes_Sociales (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    Plataforma VARCHAR(40) NOT NULL,
    Url VARCHAR(255) NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------- Notificaciones -----------------------------
CREATE TABLE IF NOT EXISTS Notificaciones (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    UsuarioId INT NOT NULL,
    BandaId INT,
    EventoId INT,
    Tipo ENUM('evento_creado', 'evento_proximo', 'informativa') NOT NULL,
    Titulo VARCHAR(180) NOT NULL,
    Mensaje VARCHAR(500),
    Leida TINYINT(1) NOT NULL DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    FOREIGN KEY (EventoId) REFERENCES Eventos(Id) ON DELETE CASCADE
) ENGINE=InnoDB;
