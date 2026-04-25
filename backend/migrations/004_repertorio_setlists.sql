-- Migración 004: añade el módulo de repertorio (canciones + setlists).
-- Idempotente: usa CREATE TABLE IF NOT EXISTS.

USE garage_manager;

-- ----------------------------- Canciones -----------------------------
CREATE TABLE IF NOT EXISTS Canciones (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    Titulo VARCHAR(160) NOT NULL,
    Tono VARCHAR(10),
    DuracionSegundos INT,
    Bpm INT,
    Notas TEXT,
    UrlReferencia VARCHAR(255),
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    INDEX idx_canciones_banda (BandaId)
) ENGINE=InnoDB;

-- ----------------------------- Setlists -----------------------------
CREATE TABLE IF NOT EXISTS Setlists (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    EventoId INT NULL,
    Nombre VARCHAR(140) NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    FOREIGN KEY (EventoId) REFERENCES Eventos(Id) ON DELETE SET NULL,
    INDEX idx_setlists_banda (BandaId),
    INDEX idx_setlists_evento (EventoId)
) ENGINE=InnoDB;

-- ----------------------------- Setlist Items -----------------------------
CREATE TABLE IF NOT EXISTS Setlist_Items (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SetlistId INT NOT NULL,
    CancionId INT NOT NULL,
    Orden INT NOT NULL DEFAULT 0,
    NotaInterpretacion VARCHAR(255),
    FOREIGN KEY (SetlistId) REFERENCES Setlists(Id) ON DELETE CASCADE,
    FOREIGN KEY (CancionId) REFERENCES Canciones(Id) ON DELETE CASCADE,
    INDEX idx_setlistitems_setlist (SetlistId)
) ENGINE=InnoDB;
