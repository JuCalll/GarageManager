from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import PUBLIC_PROFILE_RATE_LIMIT
from app.database import get_db
from app.rate_limit import limiter
from app.routers.auth import get_current_user
from app.routers.deps import validar_miembro_banda, validar_admin_banda


router = APIRouter(prefix="/bandas", tags=["Bandas"])


@router.post(
    "/", response_model=schemas.BandaResponse, status_code=status.HTTP_201_CREATED
)
def crear_banda(
    banda: schemas.BandaCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    if db.query(models.Banda).filter(models.Banda.Url == banda.Url).first():
        raise HTTPException(
            status_code=400, detail="Esta URL pública ya está en uso. Elige otra."
        )

    try:
        nueva_banda = models.Banda(**banda.model_dump())
        db.add(nueva_banda)
        db.flush()

        miembro = models.MiembroBanda(
            UsuarioId=usuario_actual.Id,
            BandaId=nueva_banda.Id,
            Rol="Administrador",
            EsAdministrador=True,
        )
        db.add(miembro)
        db.commit()
        db.refresh(nueva_banda)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible crear la banda",
        )

    return nueva_banda


@router.get("/mias", response_model=list[schemas.BandaResponse])
def listar_mis_bandas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    return (
        db.query(models.Banda)
        .join(models.MiembroBanda, models.MiembroBanda.BandaId == models.Banda.Id)
        .filter(models.MiembroBanda.UsuarioId == usuario_actual.Id)
        .order_by(models.Banda.FechaCreacion.desc())
        .all()
    )


@router.put("/{banda_id}", response_model=schemas.BandaResponse)
def actualizar_banda(
    banda_id: int,
    payload: schemas.BandaUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    banda = db.query(models.Banda).filter(models.Banda.Id == banda_id).first()
    if not banda:
        raise HTTPException(status_code=404, detail="La banda no existe")

    validar_admin_banda(db, banda_id, usuario_actual.Id)

    cambios = payload.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(banda, campo, valor)

    db.commit()
    db.refresh(banda)
    return banda


# ----------------------------- Miembros -----------------------------


@router.get("/{banda_id}/miembros", response_model=list[schemas.MiembroBandaResponse])
def listar_miembros(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    return (
        db.query(models.MiembroBanda)
        .filter(models.MiembroBanda.BandaId == banda_id)
        .all()
    )


@router.post(
    "/{banda_id}/miembros",
    response_model=schemas.MiembroBandaResponse,
    status_code=status.HTTP_201_CREATED,
)
def invitar_miembro(
    banda_id: int,
    payload: schemas.MiembroBandaInvitar,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    banda = db.query(models.Banda).filter(models.Banda.Id == banda_id).first()
    if not banda:
        raise HTTPException(status_code=404, detail="La banda no existe")

    validar_admin_banda(db, banda_id, usuario_actual.Id)

    usuario = (
        db.query(models.Usuario).filter(models.Usuario.Correo == payload.Correo).first()
    )
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="No existe un usuario registrado con ese correo",
        )

    existente = (
        db.query(models.MiembroBanda)
        .filter(
            models.MiembroBanda.BandaId == banda_id,
            models.MiembroBanda.UsuarioId == usuario.Id,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=400, detail="Este usuario ya es miembro de la banda"
        )

    miembro = models.MiembroBanda(
        UsuarioId=usuario.Id,
        BandaId=banda_id,
        Rol=payload.Rol,
        EsAdministrador=payload.EsAdministrador,
    )
    db.add(miembro)
    db.commit()
    db.refresh(miembro)
    return miembro


@router.delete(
    "/{banda_id}/miembros/{miembro_id}", status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_miembro(
    banda_id: int,
    miembro_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_admin_banda(db, banda_id, usuario_actual.Id)

    miembro = (
        db.query(models.MiembroBanda)
        .filter(
            models.MiembroBanda.Id == miembro_id,
            models.MiembroBanda.BandaId == banda_id,
        )
        .first()
    )
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")

    if miembro.UsuarioId == usuario_actual.Id:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminarte a ti mismo desde este endpoint",
        )

    db.delete(miembro)
    db.commit()


# ----------------------------- Redes sociales -----------------------------


@router.get("/{banda_id}/redes", response_model=list[schemas.RedSocialResponse])
def listar_redes(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    return (
        db.query(models.RedSocial)
        .filter(models.RedSocial.BandaId == banda_id)
        .order_by(models.RedSocial.Plataforma.asc())
        .all()
    )


@router.post(
    "/{banda_id}/redes",
    response_model=schemas.RedSocialResponse,
    status_code=status.HTTP_201_CREATED,
)
def agregar_red_social(
    banda_id: int,
    payload: schemas.RedSocialCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_admin_banda(db, banda_id, usuario_actual.Id)
    red = models.RedSocial(BandaId=banda_id, **payload.model_dump())
    db.add(red)
    db.commit()
    db.refresh(red)
    return red


@router.delete(
    "/{banda_id}/redes/{red_id}", status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_red_social(
    banda_id: int,
    red_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_admin_banda(db, banda_id, usuario_actual.Id)
    red = (
        db.query(models.RedSocial)
        .filter(models.RedSocial.Id == red_id, models.RedSocial.BandaId == banda_id)
        .first()
    )
    if not red:
        raise HTTPException(status_code=404, detail="Red social no encontrada")
    db.delete(red)
    db.commit()


# ----------------------------- Perfil público -----------------------------


@router.get("/publico/{url}", response_model=schemas.BandaPublicaResponse)
@limiter.limit(PUBLIC_PROFILE_RATE_LIMIT)
def obtener_perfil_publico(request: Request, url: str, db: Session = Depends(get_db)):
    """Endpoint público (sin autenticación) para compartir con organizadores."""
    banda = db.query(models.Banda).filter(models.Banda.Url == url).first()
    if not banda:
        raise HTTPException(status_code=404, detail="Banda no encontrada")

    redes = (
        db.query(models.RedSocial)
        .filter(models.RedSocial.BandaId == banda.Id)
        .all()
    )

    eventos = (
        db.query(models.Evento)
        .filter(
            models.Evento.BandaId == banda.Id,
            models.Evento.Fecha >= date.today(),
        )
        .order_by(models.Evento.Fecha.asc())
        .limit(5)
        .all()
    )

    def _formatear_hora(hora):
        if hasattr(hora, "total_seconds"):
            total = int(hora.total_seconds())
            h = total // 3600
            m = (total % 3600) // 60
            return f"{h:02d}:{m:02d}"
        return str(hora)[:5]

    return {
        "Id": banda.Id,
        "Nombre": banda.Nombre,
        "Genero": banda.Genero,
        "Ciudad": banda.Ciudad,
        "Descripcion": banda.Descripcion,
        "PortadaUrl": banda.PortadaUrl,
        "Url": banda.Url,
        "Redes": redes,
        "ProximosEventos": [
            {
                "Nombre": e.Nombre,
                "Fecha": e.Fecha,
                "Hora": _formatear_hora(e.Hora),
                "Lugar": e.Lugar,
                "Ciudad": banda.Ciudad,
            }
            for e in eventos
        ],
    }
