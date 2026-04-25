import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.routers.deps import validar_miembro_banda
from app.services.notificaciones import notificar_nuevo_evento


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/eventos", tags=["Eventos"])


def _formatear_hora(hora) -> str:
    if isinstance(hora, timedelta):
        total = int(hora.total_seconds())
        h = total // 3600
        m = (total % 3600) // 60
        s = total % 60
        return f"{h:02d}:{m:02d}:{s:02d}"
    return str(hora)


def _evento_to_dict(evento: models.Evento) -> dict:
    return {
        "Id": evento.Id,
        "BandaId": evento.BandaId,
        "Nombre": evento.Nombre,
        "Fecha": evento.Fecha,
        "Hora": _formatear_hora(evento.Hora),
        "Lugar": evento.Lugar,
        "Direccion": evento.Direccion,
        "CondicionPago": evento.CondicionPago,
        "ContactoOrganizador": evento.ContactoOrganizador,
        "Notas": evento.Notas,
    }


@router.post("/", response_model=schemas.EventoResponse, status_code=status.HTTP_201_CREATED)
def crear_evento(
    evento: schemas.EventoCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    banda = db.query(models.Banda).filter(models.Banda.Id == evento.BandaId).first()
    if not banda:
        raise HTTPException(status_code=404, detail="La banda no existe")

    validar_miembro_banda(db, evento.BandaId, usuario_actual.Id)

    nuevo_evento = models.Evento(**evento.model_dump(), UsuarioId=usuario_actual.Id)
    db.add(nuevo_evento)
    db.commit()
    db.refresh(nuevo_evento)

    # Notificación a los miembros al crear el evento.
    try:
        notificar_nuevo_evento(db, nuevo_evento)
    except Exception as exc:  # noqa: BLE001 - log y continuamos sin romper la creación
        db.rollback()
        logger.exception(
            "No se pudieron generar notificaciones para el evento %s: %s",
            nuevo_evento.Id,
            exc,
        )

    return _evento_to_dict(nuevo_evento)


@router.get("/banda/{banda_id}", response_model=list[schemas.EventoResponse])
def listar_eventos_banda(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    eventos = (
        db.query(models.Evento)
        .filter(models.Evento.BandaId == banda_id)
        .order_by(models.Evento.Fecha.asc())
        .all()
    )
    return [_evento_to_dict(e) for e in eventos]


@router.put("/{evento_id}", response_model=schemas.EventoResponse)
def actualizar_evento(
    evento_id: int,
    payload: schemas.EventoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    evento = db.query(models.Evento).filter(models.Evento.Id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    validar_miembro_banda(db, evento.BandaId, usuario_actual.Id)

    cambios = payload.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(evento, campo, valor)

    db.commit()
    db.refresh(evento)
    return _evento_to_dict(evento)


@router.delete("/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    evento = db.query(models.Evento).filter(models.Evento.Id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    validar_miembro_banda(db, evento.BandaId, usuario_actual.Id)
    db.delete(evento)
    db.commit()
