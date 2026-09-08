"""Valores de dominio que antes viajaban como cadenas literales."""


class TipoMovimiento:
    INGRESO = "ingreso"
    GASTO = "gasto"


class EstadoMovimiento:
    PENDIENTE = "pendiente"
    COBRADO = "cobrado"
    REEMBOLSADO = "reembolsado"


class EstadoBalance:
    A_FAVOR = "a favor"
    AL_DIA = "al dia"


class TipoNotificacion:
    EVENTO_CREADO = "evento_creado"
    EVENTO_PROXIMO = "evento_proximo"


ROL_ADMINISTRADOR = "Administrador"
