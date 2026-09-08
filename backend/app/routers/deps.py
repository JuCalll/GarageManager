from typing import Any, TypeVar

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models


T = TypeVar("T")


def obtener_o_404(db: Session, modelo: type[T], mensaje: str, **filtros: Any) -> T:
    """Recupera el primer registro que cumpla `filtros` o lanza un 404."""
    registro = db.query(modelo).filter_by(**filtros).first()
    if not registro:
        raise HTTPException(status_code=404, detail=mensaje)
    return registro


def validar_miembro_banda(db: Session, banda_id: int, usuario_id: int) -> models.MiembroBanda:
    miembro = (
        db.query(models.MiembroBanda)
        .filter(
            models.MiembroBanda.BandaId == banda_id,
            models.MiembroBanda.UsuarioId == usuario_id,
        )
        .first()
    )
    if not miembro:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos sobre esta banda",
        )
    return miembro


def validar_admin_banda(db: Session, banda_id: int, usuario_id: int) -> models.MiembroBanda:
    miembro = validar_miembro_banda(db, banda_id, usuario_id)
    if not miembro.EsAdministrador:
        raise HTTPException(
            status_code=403,
            detail="Esta acción requiere permisos de administrador de la banda",
        )
    return miembro
