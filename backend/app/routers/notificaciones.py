from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.notificaciones import generar_recordatorios_proximos


router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/", response_model=list[schemas.NotificacionResponse])
def listar_notificaciones(
    solo_no_leidas: bool = False,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    # Genera recordatorios de eventos próximos bajo demanda.
    generar_recordatorios_proximos(db)

    query = db.query(models.Notificacion).filter(
        models.Notificacion.UsuarioId == usuario_actual.Id
    )
    if solo_no_leidas:
        query = query.filter(models.Notificacion.Leida.is_(False))

    return query.order_by(models.Notificacion.FechaCreacion.desc()).limit(50).all()


@router.post("/{notificacion_id}/leer", response_model=schemas.NotificacionResponse)
def marcar_como_leida(
    notificacion_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    notificacion = (
        db.query(models.Notificacion)
        .filter(
            models.Notificacion.Id == notificacion_id,
            models.Notificacion.UsuarioId == usuario_actual.Id,
        )
        .first()
    )
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notificacion.Leida = True
    db.commit()
    db.refresh(notificacion)
    return notificacion


@router.post("/leer-todas", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todas_leidas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    db.query(models.Notificacion).filter(
        models.Notificacion.UsuarioId == usuario_actual.Id,
        models.Notificacion.Leida.is_(False),
    ).update({"Leida": True})
    db.commit()
