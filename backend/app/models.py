from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    TIMESTAMP,
    Boolean,
    text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "Usuarios"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Nombre = Column(String(100), nullable=False)
    Correo = Column(String(150), unique=True, nullable=False)
    Contrasena = Column(String(250), nullable=False)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class Banda(Base):
    __tablename__ = "Bandas"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Nombre = Column(String(120), nullable=False)
    Genero = Column(String(80))
    Ciudad = Column(String(100))
    Descripcion = Column(Text)
    PortadaUrl = Column(String(255))
    Url = Column(String(100), unique=True, nullable=False)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    Redes = relationship("RedSocial", back_populates="Banda", cascade="all, delete-orphan")


class MiembroBanda(Base):
    __tablename__ = "Miembros_Bandas"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UsuarioId = Column(
        Integer, ForeignKey("Usuarios.Id", ondelete="RESTRICT"), nullable=False
    )
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    Rol = Column(String(80), nullable=False)
    EsAdministrador = Column(Boolean, nullable=False, server_default=text("0"))
    FechaIngreso = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    Usuario = relationship("Usuario")
    Banda = relationship("Banda")


class RedSocial(Base):
    __tablename__ = "Redes_Sociales"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    Plataforma = Column(String(40), nullable=False)
    Url = Column(String(255), nullable=False)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    Banda = relationship("Banda", back_populates="Redes")


class Evento(Base):
    __tablename__ = "Eventos"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    UsuarioId = Column(Integer, ForeignKey("Usuarios.Id", ondelete="SET NULL"), nullable=True)
    Nombre = Column(String(140), nullable=False)
    Fecha = Column(Date, nullable=False)
    Hora = Column(String(10), nullable=False)
    Lugar = Column(String(140), nullable=False)
    Direccion = Column(String(200))
    CondicionPago = Column(
        Enum("remunerado", "sin remuneracion", name="evento_condicion_pago"),
        nullable=False,
    )
    ContactoOrganizador = Column(String(180))
    Notas = Column(Text)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class RegistroFinanciero(Base):
    __tablename__ = "Finanzas"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    EventoId = Column(Integer, ForeignKey("Eventos.Id", ondelete="SET NULL"), nullable=True)
    UsuarioPagoId = Column(
        Integer, ForeignKey("Usuarios.Id", ondelete="SET NULL"), nullable=True
    )
    Tipo = Column(Enum("ingreso", "gasto", name="finanza_tipo"), nullable=False)
    Categoria = Column(
        Enum(
            "transporte",
            "sonido",
            "equipos",
            "promocion",
            "otros",
            name="finanza_categoria",
        ),
        nullable=True,
    )
    Estado = Column(
        Enum(
            "pendiente",
            "cobrado",
            "reembolsado",
            name="finanza_estado",
        ),
        nullable=False,
        server_default=text("'cobrado'"),
    )
    Monto = Column(Numeric(12, 2), nullable=False)
    Descripcion = Column(String(255))
    Fecha = Column(Date, nullable=False)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class NotaInterna(Base):
    __tablename__ = "Notas"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    UsuarioId = Column(Integer, ForeignKey("Usuarios.Id", ondelete="SET NULL"), nullable=True)
    Contenido = Column(Text, nullable=False)
    Fijada = Column(Boolean, nullable=False, server_default=text("0"))
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    FechaModificacion = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
    )


class Cancion(Base):
    __tablename__ = "Canciones"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    Titulo = Column(String(160), nullable=False)
    Tono = Column(String(10))
    DuracionSegundos = Column(Integer)
    Bpm = Column(Integer)
    Notas = Column(Text)
    UrlReferencia = Column(String(255))
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class Setlist(Base):
    __tablename__ = "Setlists"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BandaId = Column(Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=False)
    EventoId = Column(
        Integer, ForeignKey("Eventos.Id", ondelete="SET NULL"), nullable=True
    )
    Nombre = Column(String(140), nullable=False)
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    Items = relationship(
        "SetlistItem",
        back_populates="Setlist",
        cascade="all, delete-orphan",
        order_by="SetlistItem.Orden",
    )


class SetlistItem(Base):
    __tablename__ = "Setlist_Items"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    SetlistId = Column(
        Integer, ForeignKey("Setlists.Id", ondelete="CASCADE"), nullable=False
    )
    CancionId = Column(
        Integer, ForeignKey("Canciones.Id", ondelete="CASCADE"), nullable=False
    )
    Orden = Column(Integer, nullable=False, server_default=text("0"))
    NotaInterpretacion = Column(String(255))

    Setlist = relationship("Setlist", back_populates="Items")
    Cancion = relationship("Cancion")


class Notificacion(Base):
    __tablename__ = "Notificaciones"

    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UsuarioId = Column(
        Integer, ForeignKey("Usuarios.Id", ondelete="CASCADE"), nullable=False
    )
    BandaId = Column(
        Integer, ForeignKey("Bandas.Id", ondelete="CASCADE"), nullable=True
    )
    EventoId = Column(
        Integer, ForeignKey("Eventos.Id", ondelete="CASCADE"), nullable=True
    )
    Tipo = Column(
        Enum(
            "evento_creado",
            "evento_proximo",
            "informativa",
            name="notificacion_tipo",
        ),
        nullable=False,
    )
    Titulo = Column(String(180), nullable=False)
    Mensaje = Column(String(500))
    Leida = Column(Boolean, nullable=False, server_default=text("0"))
    FechaCreacion = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
