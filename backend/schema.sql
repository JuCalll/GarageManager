-- Garage Manager · Esquema relacional completo
-- Compatible con MySQL/MariaDB (XAMPP).
-- Para instalación desde cero: ejecutar este archivo contra una base vacía.

CREATE DATABASE IF NOT EXISTS garage_manager
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE garage_manager;

-- ----------------------------- Usuarios -----------------------------
CREATE TABLE IF NOT EXISTS Usuarios (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    Correo VARCHAR(150) NOT NULL UNIQUE,
    Contrasena VARCHAR(250) NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------- Bandas -----------------------------
CREATE TABLE IF NOT EXISTS Bandas (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(120) NOT NULL,
    Genero VARCHAR(80),
    Ciudad VARCHAR(100),
    Descripcion TEXT,
    PortadaUrl VARCHAR(255),
    Url VARCHAR(100) NOT NULL UNIQUE,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------- Miembros_Bandas -----------------------------
CREATE TABLE IF NOT EXISTS Miembros_Bandas (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    UsuarioId INT NOT NULL,
    BandaId INT NOT NULL,
    Rol VARCHAR(80) NOT NULL,
    EsAdministrador TINYINT(1) NOT NULL DEFAULT 0,
    FechaIngreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_usuario_banda (UsuarioId, BandaId),
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE RESTRICT,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------- Redes_Sociales -----------------------------
CREATE TABLE IF NOT EXISTS Redes_Sociales (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    Plataforma VARCHAR(40) NOT NULL,
    Url VARCHAR(255) NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------- Eventos -----------------------------
CREATE TABLE IF NOT EXISTS Eventos (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    UsuarioId INT,
    Nombre VARCHAR(140) NOT NULL,
    Fecha DATE NOT NULL,
    Hora VARCHAR(10) NOT NULL,
    Lugar VARCHAR(140) NOT NULL,
    Direccion VARCHAR(200),
    CondicionPago ENUM('remunerado', 'sin remuneracion') NOT NULL,
    ContactoOrganizador VARCHAR(180),
    Notas TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------- Finanzas -----------------------------
CREATE TABLE IF NOT EXISTS Finanzas (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    EventoId INT,
    UsuarioPagoId INT,
    Tipo ENUM('ingreso', 'gasto') NOT NULL,
    Categoria ENUM('transporte', 'sonido', 'equipos', 'promocion', 'otros'),
    Estado ENUM('pendiente', 'cobrado', 'reembolsado') NOT NULL DEFAULT 'cobrado',
    Monto DECIMAL(12, 2) NOT NULL,
    Descripcion VARCHAR(255),
    Fecha DATE NOT NULL,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    FOREIGN KEY (EventoId) REFERENCES Eventos(Id) ON DELETE SET NULL,
    FOREIGN KEY (UsuarioPagoId) REFERENCES Usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------- Notas -----------------------------
CREATE TABLE IF NOT EXISTS Notas (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BandaId INT NOT NULL,
    UsuarioId INT,
    Contenido TEXT NOT NULL,
    Fijada TINYINT(1) NOT NULL DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaModificacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BandaId) REFERENCES Bandas(Id) ON DELETE CASCADE,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB;

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
