-- =============================================================================
-- Garage Manager — Script de datos de prueba (INSERT)
-- Requisito: haber ejecutado antes 01_creacion_tablas.sql en la base
--            garage_manager, con tablas vacías.
-- Contraseña de todos los usuarios demo: Demo2026!
--   (hash bcrypt_sha256 generado con la misma lógica que app.security.hash_password)
-- Si ya existen datos, no ejecute este script sin vaciar tablas o obtendrá errores
-- de clave duplicada. Para desarrollo, puede descomentar el bloque inferior.
-- =============================================================================

USE garage_manager;

-- Opcional: descomentar solo si desea empezar desde cero (¡borra todo el contenido!)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE Setlist_Items;
-- TRUNCATE TABLE Setlists;
-- TRUNCATE TABLE Canciones;
-- TRUNCATE TABLE Notificaciones;
-- TRUNCATE TABLE Finanzas;
-- TRUNCATE TABLE Notas;
-- TRUNCATE TABLE Eventos;
-- TRUNCATE TABLE Redes_Sociales;
-- TRUNCATE TABLE Miembros_Bandas;
-- TRUNCATE TABLE Bandas;
-- TRUNCATE TABLE Usuarios;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Hash único para la contraseña: Demo2026!
-- (mismo esquema que Passlib: bcrypt_sha256)
SET @hash_demo = '$bcrypt-sha256$v=2,t=2b,r=12$ZggIW7s1FI5ch3yk3W1bPu$Sm4VTIr1nSfwPyl1gvQByNdQ98grCZm';

-- Usuarios
INSERT INTO Usuarios (Id, Nombre, Correo, Contrasena) VALUES
(1, 'Ana López', 'ana.dem@example.com', @hash_demo),
(2, 'Carlos Ríos', 'carlos.dem@example.com', @hash_demo);

-- Bandas
INSERT INTO Bandas (Id, Nombre, Genero, Ciudad, Descripcion, PortadaUrl, Url) VALUES
(1, 'Aurora Sur', 'Rock alternativo', 'Medellín',
 'Banda de demostración para pruebas del sistema. Datos de ejemplo.',
 NULL, 'aurora-sur');

-- Miembros
INSERT INTO Miembros_Bandas (Id, UsuarioId, BandaId, Rol, EsAdministrador) VALUES
(1, 1, 1, 'Voz y teclado', 1),
(2, 2, 1, 'Guitarra', 0);

-- Redes sociales
INSERT INTO Redes_Sociales (BandaId, Plataforma, Url) VALUES
(1, 'Instagram', 'https://www.instagram.com/example.aurora'),
(1, 'YouTube', 'https://www.youtube.com/@aurorasur');

-- Eventos
INSERT INTO Eventos (
  Id, BandaId, UsuarioId, Nombre, Fecha, Hora, Lugar, Direccion,
  CondicionPago, ContactoOrganizador, Notas
) VALUES
(1, 1, 1, 'Show aniversario', '2026-05-10', '21:00:00',
 'Teatro El Ágora', 'Calle 10 # 20-30', 'remunerado', 'Luis P. (mánager)',
 'Llevar planos de conexión y prueba de sonido 2 h antes.'),
(2, 1, 2, 'Ensayo general', '2026-04-28', '19:30:00',
 'Sala de ensayos Norte', 'Zona industrial km 3', 'sin remuneracion', NULL, NULL);

-- Finanzas
INSERT INTO Finanzas (
  BandaId, EventoId, UsuarioPagoId, Tipo, Categoria, Estado, Monto, Descripcion, Fecha
) VALUES
(1, 1, NULL, 'ingreso', 'otros', 'cobrado', 850000.00, 'Pago toque 10 de mayo', '2026-04-20'),
(1, 2, 2, 'gasto', 'transporte', 'cobrado', 80000.00, 'Taxi carga de equipo (ensayo)', '2026-04-15'),
(1, NULL, 2, 'gasto', 'equipos', 'pendiente', 350000.00, 'Bafle nuevo (pedido a proveedor)', '2026-04-18');

-- Notas
INSERT INTO Notas (BandaId, UsuarioId, Contenido, Fijada) VALUES
(1, 1, 'Reunión con el productor: confirmar setlist 48 h antes del show.', 1),
(1, 2, 'Recordatorio: póliza del equipo vence a fin de mes.', 0);

-- Canciones
INSERT INTO Canciones (
  BandaId, Titulo, Tono, DuracionSegundos, Bpm, Notas, UrlReferencia
) VALUES
(1, 'Luz en el aire', 'Am', 240, 120, 'Intro con luces bajas', NULL),
(1, 'Río abajo', 'Em', 195, 128, 'Coro marcado; armónica en puente', NULL),
(1, 'Amanecer', 'C', 300, 90, 'Cierre; extender outro 8 compases', 'https://www.youtube.com/watch?v=ejemplo');

-- Setlist asociada al evento 1
INSERT INTO Setlists (BandaId, EventoId, Nombre) VALUES
(1, 1, 'Setlist show aniversario');

-- Ítems del setlist (CancionId 1, 2, 3 = los tres inserts anteriores en orden)
INSERT INTO Setlist_Items (SetlistId, CancionId, Orden, NotaInterpretacion) VALUES
(1, 1, 1, 'Apertura: luces bajas, fade in'),
(1, 2, 2, 'Subir energía; transición 4 compases'),
(1, 3, 3, 'Cierre; bis opcional según público');

-- Notificaciones (destinatario Carlos = usuario 2)
INSERT INTO Notificaciones (UsuarioId, BandaId, EventoId, Tipo, Titulo, Mensaje, Leida) VALUES
(2, 1, 1, 'evento_creado', 'Nuevo evento: Show aniversario', '10 de mayo, Teatro El Ágora', 0),
(2, 1, NULL, 'informativa', 'Bienvenida a Aurora Sur', 'Revise el calendario y el módulo de finanzas para la demostración.', 0);

-- Ajuste de auto_increment para no chocar con inserciones manuales posteriores
ALTER TABLE Usuarios AUTO_INCREMENT = 100;
ALTER TABLE Bandas AUTO_INCREMENT = 10;
ALTER TABLE Miembros_Bandas AUTO_INCREMENT = 10;
ALTER TABLE Eventos AUTO_INCREMENT = 10;
ALTER TABLE Finanzas AUTO_INCREMENT = 10;
ALTER TABLE Notas AUTO_INCREMENT = 10;
ALTER TABLE Canciones AUTO_INCREMENT = 10;
ALTER TABLE Setlists AUTO_INCREMENT = 10;
ALTER TABLE Setlist_Items AUTO_INCREMENT = 10;
ALTER TABLE Notificaciones AUTO_INCREMENT = 10;
