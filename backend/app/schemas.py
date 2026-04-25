from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ----------------------------- Usuarios / Auth -----------------------------


class UsuarioBase(BaseModel):
    Nombre: str
    Correo: EmailStr


class UsuarioCreate(UsuarioBase):
    Contrasena: str = Field(min_length=8, max_length=256)


class UsuarioResponse(UsuarioBase):
    Id: int

    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    Correo: EmailStr
    Contrasena: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    usuario: UsuarioResponse


# ----------------------------- Redes Sociales -----------------------------


class RedSocialBase(BaseModel):
    Plataforma: str = Field(min_length=2, max_length=40)
    Url: str = Field(min_length=4, max_length=255)


class RedSocialCreate(RedSocialBase):
    pass


class RedSocialResponse(RedSocialBase):
    Id: int
    BandaId: int

    class Config:
        from_attributes = True


# ----------------------------- Bandas -----------------------------


class BandaBase(BaseModel):
    Nombre: str = Field(min_length=2, max_length=120)
    Genero: Optional[str] = Field(default=None, max_length=80)
    Ciudad: Optional[str] = Field(default=None, max_length=100)
    Descripcion: Optional[str] = None
    PortadaUrl: Optional[str] = Field(default=None, max_length=255)
    Url: str = Field(min_length=2, max_length=100)


class BandaCreate(BandaBase):
    pass


class BandaUpdate(BaseModel):
    Nombre: Optional[str] = Field(default=None, min_length=2, max_length=120)
    Genero: Optional[str] = Field(default=None, max_length=80)
    Ciudad: Optional[str] = Field(default=None, max_length=100)
    Descripcion: Optional[str] = None
    PortadaUrl: Optional[str] = Field(default=None, max_length=255)


class BandaResponse(BandaBase):
    Id: int

    class Config:
        from_attributes = True


class BandaPublicaResponse(BaseModel):
    Id: int
    Nombre: str
    Genero: Optional[str] = None
    Ciudad: Optional[str] = None
    Descripcion: Optional[str] = None
    PortadaUrl: Optional[str] = None
    Url: str
    Redes: list[RedSocialResponse] = []
    ProximosEventos: list["EventoPublicoResponse"] = []


# ----------------------------- Miembros Banda -----------------------------


class MiembroBandaBase(BaseModel):
    Rol: str = Field(min_length=2, max_length=80)


class MiembroBandaInvitar(MiembroBandaBase):
    Correo: EmailStr
    EsAdministrador: bool = False


class MiembroBandaResponse(BaseModel):
    Id: int
    UsuarioId: int
    BandaId: int
    Rol: str
    EsAdministrador: bool
    Usuario: UsuarioResponse

    class Config:
        from_attributes = True


# ----------------------------- Eventos -----------------------------


class EventoBase(BaseModel):
    Nombre: str = Field(min_length=2, max_length=140)
    Fecha: date
    Hora: str = Field(min_length=4, max_length=10)
    Lugar: str = Field(min_length=2, max_length=140)
    Direccion: Optional[str] = Field(default=None, max_length=200)
    CondicionPago: Literal["remunerado", "sin remuneracion"]
    ContactoOrganizador: Optional[str] = Field(default=None, max_length=180)
    Notas: Optional[str] = None


class EventoCreate(EventoBase):
    BandaId: int


class EventoUpdate(BaseModel):
    Nombre: Optional[str] = Field(default=None, min_length=2, max_length=140)
    Fecha: Optional[date] = None
    Hora: Optional[str] = Field(default=None, min_length=4, max_length=10)
    Lugar: Optional[str] = Field(default=None, min_length=2, max_length=140)
    Direccion: Optional[str] = Field(default=None, max_length=200)
    CondicionPago: Optional[Literal["remunerado", "sin remuneracion"]] = None
    ContactoOrganizador: Optional[str] = Field(default=None, max_length=180)
    Notas: Optional[str] = None


class EventoResponse(EventoBase):
    Id: int
    BandaId: int

    class Config:
        from_attributes = True


class EventoPublicoResponse(BaseModel):
    Nombre: str
    Fecha: date
    Hora: str
    Lugar: str
    Ciudad: Optional[str] = None


# ----------------------------- Finanzas -----------------------------


class RegistroFinancieroBase(BaseModel):
    Tipo: Literal["ingreso", "gasto"]
    Monto: Decimal = Field(gt=0)
    EventoId: Optional[int] = None
    UsuarioPagoId: Optional[int] = None
    Categoria: Optional[
        Literal["transporte", "sonido", "equipos", "promocion", "otros"]
    ] = None
    Estado: Literal["pendiente", "cobrado", "reembolsado"] = "cobrado"
    Descripcion: Optional[str] = Field(default=None, max_length=255)
    Fecha: date


class RegistroFinancieroCreate(RegistroFinancieroBase):
    BandaId: int


class RegistroFinancieroUpdate(BaseModel):
    Tipo: Optional[Literal["ingreso", "gasto"]] = None
    Monto: Optional[Decimal] = Field(default=None, gt=0)
    EventoId: Optional[int] = None
    UsuarioPagoId: Optional[int] = None
    Categoria: Optional[
        Literal["transporte", "sonido", "equipos", "promocion", "otros"]
    ] = None
    Estado: Optional[Literal["pendiente", "cobrado", "reembolsado"]] = None
    Descripcion: Optional[str] = Field(default=None, max_length=255)
    Fecha: Optional[date] = None


class RegistroFinancieroResponse(RegistroFinancieroBase):
    Id: int
    BandaId: int

    class Config:
        from_attributes = True


class BalanceIndividualResponse(BaseModel):
    UsuarioId: int
    Nombre: str
    TotalAportado: Decimal
    PendienteReembolso: Decimal
    Estado: Literal["a favor", "en deuda", "al dia"]


class BalanceFinancieroResponse(BaseModel):
    BandaId: int
    TotalIngresos: Decimal
    TotalGastos: Decimal
    Saldo: Decimal
    IngresosPendientes: Decimal
    BalancesIndividuales: list[BalanceIndividualResponse] = []


# ----------------------------- Notas -----------------------------


class NotaBase(BaseModel):
    Contenido: str = Field(min_length=3)
    Fijada: bool = False


class NotaCreate(NotaBase):
    BandaId: int


class NotaUpdate(BaseModel):
    Contenido: Optional[str] = Field(default=None, min_length=3)
    Fijada: Optional[bool] = None


class NotaResponse(NotaBase):
    Id: int
    BandaId: int
    UsuarioId: Optional[int] = None
    FechaCreacion: datetime
    FechaModificacion: datetime

    class Config:
        from_attributes = True


# ----------------------------- Repertorio -----------------------------


class CancionBase(BaseModel):
    Titulo: str = Field(min_length=1, max_length=160)
    Tono: Optional[str] = Field(default=None, max_length=10)
    DuracionSegundos: Optional[int] = Field(default=None, ge=0, le=36000)
    Bpm: Optional[int] = Field(default=None, ge=20, le=400)
    Notas: Optional[str] = None
    UrlReferencia: Optional[str] = Field(default=None, max_length=255)


class CancionCreate(CancionBase):
    BandaId: int


class CancionUpdate(BaseModel):
    Titulo: Optional[str] = Field(default=None, min_length=1, max_length=160)
    Tono: Optional[str] = Field(default=None, max_length=10)
    DuracionSegundos: Optional[int] = Field(default=None, ge=0, le=36000)
    Bpm: Optional[int] = Field(default=None, ge=20, le=400)
    Notas: Optional[str] = None
    UrlReferencia: Optional[str] = Field(default=None, max_length=255)


class CancionResponse(CancionBase):
    Id: int
    BandaId: int

    class Config:
        from_attributes = True


class SetlistItemBase(BaseModel):
    CancionId: int
    Orden: int = 0
    NotaInterpretacion: Optional[str] = Field(default=None, max_length=255)


class SetlistItemResponse(SetlistItemBase):
    Id: int
    Cancion: CancionResponse

    class Config:
        from_attributes = True


class SetlistBase(BaseModel):
    Nombre: str = Field(min_length=1, max_length=140)
    EventoId: Optional[int] = None


class SetlistCreate(SetlistBase):
    BandaId: int
    Items: list[SetlistItemBase] = []


class SetlistUpdate(BaseModel):
    Nombre: Optional[str] = Field(default=None, min_length=1, max_length=140)
    EventoId: Optional[int] = None
    Items: Optional[list[SetlistItemBase]] = None


class SetlistResponse(SetlistBase):
    Id: int
    BandaId: int
    Items: list[SetlistItemResponse] = []
    DuracionTotalSegundos: int = 0

    class Config:
        from_attributes = True


# ----------------------------- Auth Refresh -----------------------------


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ----------------------------- Notificaciones -----------------------------


class NotificacionResponse(BaseModel):
    Id: int
    UsuarioId: int
    BandaId: Optional[int] = None
    EventoId: Optional[int] = None
    Tipo: Literal["evento_creado", "evento_proximo", "informativa"]
    Titulo: str
    Mensaje: Optional[str] = None
    Leida: bool
    FechaCreacion: datetime

    class Config:
        from_attributes = True


BandaPublicaResponse.model_rebuild()
