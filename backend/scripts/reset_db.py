"""Vacía todas las tablas de la base de datos y resetea los autoincrement.

Uso (desde backend/):
    venv\\Scripts\\python.exe scripts\\reset_db.py

Pide confirmación antes de borrar nada. No elimina las tablas, solo los datos.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.database import engine

TABLAS = [
    "Notificaciones",
    "Setlist_Items",
    "Setlists",
    "Canciones",
    "Notas",
    "Finanzas",
    "Eventos",
    "Redes_Sociales",
    "Miembros_Bandas",
    "Bandas",
    "Usuarios",
]


def main() -> int:
    print("Esto va a ELIMINAR todos los datos de:")
    for t in TABLAS:
        print(f"  - {t}")
    print()
    respuesta = input("Escribí 'BORRAR' para continuar: ").strip()
    if respuesta != "BORRAR":
        print("Cancelado, no se borró nada.")
        return 1

    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for tabla in TABLAS:
            conn.execute(text(f"TRUNCATE TABLE {tabla}"))
            print(f"  ✔ {tabla} vaciada")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

    print("\nListo. La base quedó como nueva.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
