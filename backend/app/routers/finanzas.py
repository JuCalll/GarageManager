from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.routers.deps import validar_miembro_banda


router = APIRouter(prefix="/finanzas", tags=["Finanzas"])


@router.post(
    "/",
    response_model=schemas.RegistroFinancieroResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_registro(
    registro: schemas.RegistroFinancieroCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    banda = db.query(models.Banda).filter(models.Banda.Id == registro.BandaId).first()
    if not banda:
        raise HTTPException(status_code=404, detail="La banda no existe")

    validar_miembro_banda(db, registro.BandaId, usuario_actual.Id)

    if registro.EventoId:
        evento = (
            db.query(models.Evento)
            .filter(
                models.Evento.Id == registro.EventoId,
                models.Evento.BandaId == registro.BandaId,
            )
            .first()
        )
        if not evento:
            raise HTTPException(
                status_code=400, detail="El evento no pertenece a la banda indicada"
            )

    if registro.UsuarioPagoId:
        es_miembro = (
            db.query(models.MiembroBanda)
            .filter(
                models.MiembroBanda.BandaId == registro.BandaId,
                models.MiembroBanda.UsuarioId == registro.UsuarioPagoId,
            )
            .first()
        )
        if not es_miembro:
            raise HTTPException(
                status_code=400,
                detail="El usuario que pagó debe ser miembro de la banda",
            )

    nuevo = models.RegistroFinanciero(**registro.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get(
    "/banda/{banda_id}", response_model=list[schemas.RegistroFinancieroResponse]
)
def listar_finanzas_banda(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)
    return (
        db.query(models.RegistroFinanciero)
        .filter(models.RegistroFinanciero.BandaId == banda_id)
        .order_by(models.RegistroFinanciero.Fecha.desc())
        .all()
    )


@router.put("/{registro_id}", response_model=schemas.RegistroFinancieroResponse)
def actualizar_registro(
    registro_id: int,
    payload: schemas.RegistroFinancieroUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    registro = (
        db.query(models.RegistroFinanciero)
        .filter(models.RegistroFinanciero.Id == registro_id)
        .first()
    )
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    validar_miembro_banda(db, registro.BandaId, usuario_actual.Id)

    cambios = payload.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(registro, campo, valor)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_registro(
    registro_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    registro = (
        db.query(models.RegistroFinanciero)
        .filter(models.RegistroFinanciero.Id == registro_id)
        .first()
    )
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    validar_miembro_banda(db, registro.BandaId, usuario_actual.Id)
    db.delete(registro)
    db.commit()


@router.get(
    "/banda/{banda_id}/balance", response_model=schemas.BalanceFinancieroResponse
)
def obtener_balance(
    banda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(get_current_user),
):
    validar_miembro_banda(db, banda_id, usuario_actual.Id)

    total_ingresos = (
        db.query(func.coalesce(func.sum(models.RegistroFinanciero.Monto), 0))
        .filter(
            models.RegistroFinanciero.BandaId == banda_id,
            models.RegistroFinanciero.Tipo == "ingreso",
            models.RegistroFinanciero.Estado == "cobrado",
        )
        .scalar()
    )
    ingresos_pendientes = (
        db.query(func.coalesce(func.sum(models.RegistroFinanciero.Monto), 0))
        .filter(
            models.RegistroFinanciero.BandaId == banda_id,
            models.RegistroFinanciero.Tipo == "ingreso",
            models.RegistroFinanciero.Estado == "pendiente",
        )
        .scalar()
    )
    total_gastos = (
        db.query(func.coalesce(func.sum(models.RegistroFinanciero.Monto), 0))
        .filter(
            models.RegistroFinanciero.BandaId == banda_id,
            models.RegistroFinanciero.Tipo == "gasto",
        )
        .scalar()
    )

    ingresos = Decimal(total_ingresos or 0)
    pendientes = Decimal(ingresos_pendientes or 0)
    gastos = Decimal(total_gastos or 0)

    balances_individuales = _calcular_balances_individuales(db, banda_id)

    return {
        "BandaId": banda_id,
        "TotalIngresos": ingresos,
        "TotalGastos": gastos,
        "Saldo": ingresos - gastos,
        "IngresosPendientes": pendientes,
        "BalancesIndividuales": balances_individuales,
    }


def _calcular_balances_individuales(db: Session, banda_id: int) -> list[dict]:
    miembros = (
        db.query(models.MiembroBanda, models.Usuario)
        .join(models.Usuario, models.Usuario.Id == models.MiembroBanda.UsuarioId)
        .filter(models.MiembroBanda.BandaId == banda_id)
        .all()
    )

    resultado = []
    for _miembro, usuario in miembros:
        total_aportado = (
            db.query(func.coalesce(func.sum(models.RegistroFinanciero.Monto), 0))
            .filter(
                models.RegistroFinanciero.BandaId == banda_id,
                models.RegistroFinanciero.Tipo == "gasto",
                models.RegistroFinanciero.UsuarioPagoId == usuario.Id,
            )
            .scalar()
        )
        pendiente_reembolso = (
            db.query(func.coalesce(func.sum(models.RegistroFinanciero.Monto), 0))
            .filter(
                models.RegistroFinanciero.BandaId == banda_id,
                models.RegistroFinanciero.Tipo == "gasto",
                models.RegistroFinanciero.UsuarioPagoId == usuario.Id,
                models.RegistroFinanciero.Estado == "pendiente",
            )
            .scalar()
        )

        pendiente = Decimal(pendiente_reembolso or 0)
        aportado = Decimal(total_aportado or 0)

        if pendiente > 0:
            estado = "a favor"
        elif aportado > 0:
            estado = "al dia"
        else:
            estado = "al dia"

        resultado.append(
            {
                "UsuarioId": usuario.Id,
                "Nombre": usuario.Nombre,
                "TotalAportado": aportado,
                "PendienteReembolso": pendiente,
                "Estado": estado,
            }
        )

    return resultado
