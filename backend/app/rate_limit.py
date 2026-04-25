"""Configuración compartida de rate limiting basada en slowapi.

Se expone una única instancia de `Limiter` para reutilizarla como decorador en
los endpoints que necesiten protección frente a abuso (login, perfil público,
etc.). El límite efectivo se define en cada decorador.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(key_func=get_remote_address, headers_enabled=False)
