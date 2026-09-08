"""Utilidades de formato compartidas por los routers."""

from datetime import timedelta


def _descomponer_hora(hora) -> tuple[int, int, int] | None:
    """Devuelve (horas, minutos, segundos) si el valor es un timedelta."""
    if isinstance(hora, timedelta):
        total = int(hora.total_seconds())
        return total // 3600, (total % 3600) // 60, total % 60
    return None


def formatear_hora(hora) -> str:
    """Formato HH:MM:SS usado por la API privada de eventos."""
    partes = _descomponer_hora(hora)
    if partes is None:
        return str(hora)
    horas, minutos, segundos = partes
    return f"{horas:02d}:{minutos:02d}:{segundos:02d}"


def formatear_hora_corta(hora) -> str:
    """Formato HH:MM usado por el perfil público."""
    partes = _descomponer_hora(hora)
    if partes is None:
        return str(hora)[:5]
    horas, minutos, _ = partes
    return f"{horas:02d}:{minutos:02d}"
