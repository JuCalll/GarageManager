from datetime import date, timedelta

from sqlalchemy.orm import Session

from app import models
from app.constantes import TipoNotificacion


def _miembros_de_banda(db: Session, banda_id: int) -> list[models.MiembroBanda]:
    return (
        db.query(models.MiembroBanda)
        .filter(models.MiembroBanda.BandaId == banda_id)
        .all()
    )


def _nueva_notificacion(
    usuario_id: int, evento: models.Evento, tipo: str, titulo: str, mensaje: str
) -> models.Notificacion:
    return models.Notificacion(
        UsuarioId=usuario_id,
        BandaId=evento.BandaId,
        EventoId=evento.Id,
        Tipo=tipo,
        Titulo=titulo,
        Mensaje=mensaje,
    )


def notificar_nuevo_evento(db: Session, evento: models.Evento) -> None:
    """Crea una notificación para cada miembro de la banda cuando se registra un evento."""
    for miembro in _miembros_de_banda(db, evento.BandaId):
        db.add(
            _nueva_notificacion(
                miembro.UsuarioId,
                evento,
                TipoNotificacion.EVENTO_CREADO,
                "Nuevo evento agendado",
                f"Se agendó '{evento.Nombre}' para el {evento.Fecha}.",
            )
        )
    db.commit()


def generar_recordatorios_proximos(db: Session) -> int:
    """
    Genera notificaciones de tipo 'evento_proximo' para eventos que ocurren
    en los próximos 2 días y aún no han sido notificados a cada miembro.
    Devuelve el total de notificaciones creadas.
    """
    hoy = date.today()
    limite = hoy + timedelta(days=2)

    eventos = (
        db.query(models.Evento)
        .filter(models.Evento.Fecha >= hoy, models.Evento.Fecha <= limite)
        .all()
    )

    creadas = 0
    for evento in eventos:
        for miembro in _miembros_de_banda(db, evento.BandaId):
            ya_existe = (
                db.query(models.Notificacion)
                .filter(
                    models.Notificacion.UsuarioId == miembro.UsuarioId,
                    models.Notificacion.EventoId == evento.Id,
                    models.Notificacion.Tipo == TipoNotificacion.EVENTO_PROXIMO,
                )
                .first()
            )
            if ya_existe:
                continue

            db.add(
                _nueva_notificacion(
                    miembro.UsuarioId,
                    evento,
                    TipoNotificacion.EVENTO_PROXIMO,
                    "Evento próximo",
                    f"Faltan menos de 48h para '{evento.Nombre}' ({evento.Fecha}).",
                )
            )
            creadas += 1

    if creadas:
        db.commit()
    return creadas
