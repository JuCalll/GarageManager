"""Configuración compartida para los tests del backend.

Estrategia:

* Antes de importar la app, se redirige `DATABASE_URL` a una base SQLite en
  memoria por test (cada test arranca con un schema limpio).
* Se sobreescriben las dependencias `get_db` y se ajustan los rate limits para
  no interferir con la batería de pruebas.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Generator

# Aseguramos que la raíz `backend/` esté en sys.path para poder importar `app`.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Variables de entorno que afectan a la configuración antes de importar la app.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ["LOGIN_RATE_LIMIT"] = "1000/minute"
os.environ["PUBLIC_PROFILE_RATE_LIMIT"] = "1000/minute"
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import models  # noqa: E402
from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def db_session() -> Generator:
    """Crea un engine SQLite aislado para el test y devuelve una sesión."""

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    models.Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        models.Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session) -> Generator[TestClient, None, None]:
    """TestClient FastAPI usando la sesión SQLite del test actual."""

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers reutilizables
# ---------------------------------------------------------------------------


@pytest.fixture()
def usuario_registrado(client) -> dict:
    payload = {
        "Nombre": "Tester Drummer",
        "Correo": "drummer@test.com",
        "Contrasena": "Password123",
    }
    resp = client.post("/auth/registro", json=payload)
    assert resp.status_code == 201, resp.text
    return {**payload, **resp.json()}


@pytest.fixture()
def headers_auth(client, usuario_registrado) -> dict:
    resp = client.post(
        "/auth/login",
        json={
            "Correo": usuario_registrado["Correo"],
            "Contrasena": usuario_registrado["Contrasena"],
        },
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def banda_creada(client, headers_auth) -> dict:
    payload = {
        "Nombre": "The Test Band",
        "Url": "the-test-band",
        "Genero": "Rock",
        "Ciudad": "Bogotá",
        "Descripcion": "Banda de pruebas automatizadas.",
    }
    resp = client.post("/bandas/", json=payload, headers=headers_auth)
    assert resp.status_code == 201, resp.text
    return resp.json()
