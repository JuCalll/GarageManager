from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app import models


def notificar_nuevo_evento(db: Session, evento: models.Evento) -> None:
    """Crea una notificación para cada miembro de la banda cuando se registra un evento."""
    miembros = (
        db.query(models.MiembroBanda)
        .filter(models.MiembroBanda.BandaId == evento.BandaId)
        .all()
    )
    for miembro in miembros:
        notificacion = models.Notificacion(
            UsuarioId=miembro.UsuarioId,
            BandaId=evento.BandaId,
            EventoId=evento.Id,
            Tipo="evento_creado",
            Titulo="Nuevo evento agendado",
            Mensaje=f"Se agendó '{evento.Nombre}' para el {evento.Fecha}.",
        )
        db.add(notificacion)
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
        miembros = (
            db.query(models.MiembroBanda)
            .filter(models.MiembroBanda.BandaId == evento.BandaId)
            .all()
        )
        for miembro in miembros:
            ya_existe = (
                db.query(models.Notificacion)
                .filter(
                    models.Notificacion.UsuarioId == miembro.UsuarioId,
                    models.Notificacion.EventoId == evento.Id,
                    models.Notificacion.Tipo == "evento_proximo",
                )
                .first()
            )
            if ya_existe:
                continue

            db.add(
                models.Notificacion(
                    UsuarioId=miembro.UsuarioId,
                    BandaId=evento.BandaId,
                    EventoId=evento.Id,
                    Tipo="evento_proximo",
                    Titulo="Evento próximo",
                    Mensaje=f"Faltan menos de 48h para '{evento.Nombre}' ({evento.Fecha}).",
                )
            )
            creadas += 1

    if creadas:
        db.commit()
    return creadas
