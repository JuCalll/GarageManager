"""API REST: catálogo de canciones y setlists por banda."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.routers.deps import validar_miembro_banda


router = APIRouter(prefix="/repertorio", tags=["Repertorio"])


# ---------------------------------------------------------------------------
# Canciones
# ---------------------------------------------------------------------------


@router.get(
    "/bandas/{banda_id}/canciones",
    response_model=list[schemas.CancionResponse],
)
def listar_canciones(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    return (
        db.query(models.Cancion)
        .filter(models.Cancion.BandaId == banda_id)
        .order_by(models.Cancion.Titulo.asc())
        .all()
    )


@router.post(
    "/canciones",
    response_model=schemas.CancionResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_cancion(
    cancion: schemas.CancionCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, cancion.BandaId, usuario_actual.Id)

    nueva = models.Cancion(**cancion.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.put("/canciones/{cancion_id}", response_model=schemas.CancionResponse)
def actualizar_cancion(
    cancion_id: int,
    cambios: schemas.CancionUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    cancion = db.query(models.Cancion).filter(models.Cancion.Id == cancion_id).first()
    if not cancion:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    validar_miembro_banda(db, cancion.BandaId, usuario_actual.Id)

    for campo, valor in cambios.model_dump(exclude_unset=True).items():
        setattr(cancion, campo, valor)

    db.commit()
    db.refresh(cancion)
    return cancion


@router.delete("/canciones/{cancion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cancion(
    cancion_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    cancion = db.query(models.Cancion).filter(models.Cancion.Id == cancion_id).first()
    if not cancion:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    validar_miembro_banda(db, cancion.BandaId, usuario_actual.Id)

    db.delete(cancion)
    db.commit()


# ---------------------------------------------------------------------------
# Setlists
# ---------------------------------------------------------------------------


def _serializar_setlist(setlist: models.Setlist) -> dict:
    """Construye el payload de respuesta incluyendo la duración total."""

    items = sorted(setlist.Items or [], key=lambda i: i.Orden)
    duracion_total = sum(
        (item.Cancion.DuracionSegundos or 0) for item in items if item.Cancion
    )
    return {
        "Id": setlist.Id,
        "BandaId": setlist.BandaId,
        "EventoId": setlist.EventoId,
        "Nombre": setlist.Nombre,
        "Items": [
            {
                "Id": item.Id,
                "CancionId": item.CancionId,
                "Orden": item.Orden,
                "NotaInterpretacion": item.NotaInterpretacion,
                "Cancion": item.Cancion,
            }
            for item in items
        ],
        "DuracionTotalSegundos": duracion_total,
    }


def _aplicar_items(db: Session, setlist: models.Setlist, items: list[schemas.SetlistItemBase]):
    """Reemplaza por completo los items del setlist con la lista provista."""

    db.query(models.SetlistItem).filter(
        models.SetlistItem.SetlistId == setlist.Id
    ).delete()

    canciones_validas = {
        c.Id
        for c in db.query(models.Cancion.Id)
        .filter(models.Cancion.BandaId == setlist.BandaId)
        .all()
    }

    for indice, item in enumerate(items):
        if item.CancionId not in canciones_validas:
            raise HTTPException(
                status_code=400,
                detail=f"La canción {item.CancionId} no pertenece a la banda",
            )
        db.add(
            models.SetlistItem(
                SetlistId=setlist.Id,
                CancionId=item.CancionId,
                Orden=item.Orden if item.Orden is not None else indice,
                NotaInterpretacion=item.NotaInterpretacion,
            )
        )


@router.get(
    "/bandas/{banda_id}/setlists",
    response_model=list[schemas.SetlistResponse],
)
def listar_setlists(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)

    setlists = (
        db.query(models.Setlist)
        .options(joinedload(models.Setlist.Items).joinedload(models.SetlistItem.Cancion))
        .filter(models.Setlist.BandaId == banda_id)
        .order_by(models.Setlist.FechaCreacion.desc())
        .all()
    )
    return [_serializar_setlist(s) for s in setlists]


@router.get("/setlists/{setlist_id}", response_model=schemas.SetlistResponse)
def obtener_setlist(
    setlist_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    setlist = (
        db.query(models.Setlist)
        .options(joinedload(models.Setlist.Items).joinedload(models.SetlistItem.Cancion))
        .filter(models.Setlist.Id == setlist_id)
        .first()
    )
    if not setlist:
        raise HTTPException(status_code=404, detail="Setlist no encontrado")
    validar_miembro_banda(db, setlist.BandaId, usuario_actual.Id)
    return _serializar_setlist(setlist)


@router.get(
    "/eventos/{evento_id}/setlist",
    response_model=schemas.SetlistResponse | None,
)
def obtener_setlist_de_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    evento = db.query(models.Evento).filter(models.Evento.Id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    validar_miembro_banda(db, evento.BandaId, usuario_actual.Id)

    setlist = (
        db.query(models.Setlist)
        .options(joinedload(models.Setlist.Items).joinedload(models.SetlistItem.Cancion))
        .filter(models.Setlist.EventoId == evento_id)
        .order_by(models.Setlist.FechaCreacion.desc())
        .first()
    )
    if not setlist:
        return None
    return _serializar_setlist(setlist)


@router.post(
    "/setlists",
    response_model=schemas.SetlistResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_setlist(
    payload: schemas.SetlistCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, payload.BandaId, usuario_actual.Id)

    if payload.EventoId:
        evento = (
            db.query(models.Evento).filter(models.Evento.Id == payload.EventoId).first()
        )
        if not evento or evento.BandaId != payload.BandaId:
            raise HTTPException(
                status_code=400,
                detail="El evento indicado no pertenece a esta banda",
            )

    setlist = models.Setlist(
        BandaId=payload.BandaId,
        EventoId=payload.EventoId,
        Nombre=payload.Nombre,
    )
    db.add(setlist)
    db.flush()

    _aplicar_items(db, setlist, payload.Items)
    db.commit()
    db.refresh(setlist)

    return _serializar_setlist(setlist)


@router.put("/setlists/{setlist_id}", response_model=schemas.SetlistResponse)
def actualizar_setlist(
    setlist_id: int,
    cambios: schemas.SetlistUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    setlist = db.query(models.Setlist).filter(models.Setlist.Id == setlist_id).first()
    if not setlist:
        raise HTTPException(status_code=404, detail="Setlist no encontrado")
    validar_miembro_banda(db, setlist.BandaId, usuario_actual.Id)

    datos = cambios.model_dump(exclude_unset=True)
    if "Nombre" in datos:
        setlist.Nombre = datos["Nombre"]
    if "EventoId" in datos:
        nuevo_evento_id = datos["EventoId"]
        if nuevo_evento_id is not None:
            evento = (
                db.query(models.Evento)
                .filter(models.Evento.Id == nuevo_evento_id)
                .first()
            )
            if not evento or evento.BandaId != setlist.BandaId:
                raise HTTPException(
                    status_code=400,
                    detail="El evento indicado no pertenece a esta banda",
                )
        setlist.EventoId = nuevo_evento_id
    if "Items" in datos and datos["Items"] is not None:
        _aplicar_items(db, setlist, cambios.Items or [])

    db.commit()
    db.refresh(setlist)
    return _serializar_setlist(setlist)


@router.delete("/setlists/{setlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_setlist(
    setlist_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    setlist = db.query(models.Setlist).filter(models.Setlist.Id == setlist_id).first()
    if not setlist:
        raise HTTPException(status_code=404, detail="Setlist no encontrado")
    validar_miembro_banda(db, setlist.BandaId, usuario_actual.Id)

    db.delete(setlist)
    db.commit()
