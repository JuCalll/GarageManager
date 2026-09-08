from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.routers.deps import obtener_o_404, validar_miembro_banda


router = APIRouter(prefix="/notas", tags=["Notas"])


def _nota_to_dict(nota: models.NotaInterna) -> dict:
    return {
        "Id": nota.Id,
        "BandaId": nota.BandaId,
        "UsuarioId": nota.UsuarioId,
        "Contenido": nota.Contenido,
        "Fijada": bool(nota.Fijada),
        "FechaCreacion": nota.FechaCreacion,
        "FechaModificacion": nota.FechaModificacion,
    }


@router.post("/", response_model=schemas.NotaResponse, status_code=status.HTTP_201_CREATED)
def crear_nota(
    nota: schemas.NotaCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, nota.BandaId, usuario_actual.Id)

    nueva = models.NotaInterna(
        BandaId=nota.BandaId,
        UsuarioId=usuario_actual.Id,
        Contenido=nota.Contenido,
        Fijada=nota.Fijada,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return _nota_to_dict(nueva)


@router.get("/banda/{banda_id}", response_model=list[schemas.NotaResponse])
def listar_notas(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    notas = (
        db.query(models.NotaInterna)
        .filter(models.NotaInterna.BandaId == banda_id)
        .order_by(
            models.NotaInterna.Fijada.desc(),
            models.NotaInterna.FechaCreacion.desc(),
        )
        .all()
    )
    return [_nota_to_dict(n) for n in notas]


@router.put("/{nota_id}", response_model=schemas.NotaResponse)
def actualizar_nota(
    nota_id: int,
    payload: schemas.NotaUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    nota = obtener_o_404(db, models.NotaInterna, "La nota no existe", Id=nota_id)

    validar_miembro_banda(db, nota.BandaId, usuario_actual.Id)

    cambios = payload.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(nota, campo, valor)

    db.commit()
    db.refresh(nota)
    return _nota_to_dict(nota)


@router.delete("/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_nota(
    nota_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    nota = obtener_o_404(db, models.NotaInterna, "La nota no existe", Id=nota_id)

    validar_miembro_banda(db, nota.BandaId, usuario_actual.Id)
    db.delete(nota)
    db.commit()
