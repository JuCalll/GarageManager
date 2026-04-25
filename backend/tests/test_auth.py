"""Tests del flujo de autenticación: registro, login, refresh y autorización."""

from app.security import create_refresh_token


def test_registro_devuelve_usuario(client):
    resp = client.post(
        "/auth/registro",
        json={
            "Nombre": "Nuevo",
            "Correo": "nuevo@test.com",
            "Contrasena": "Password123",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["Correo"] == "nuevo@test.com"
    assert "Id" in data


def test_registro_correo_duplicado_falla(client, usuario_registrado):
    resp = client.post(
        "/auth/registro",
        json={
            "Nombre": "Otro",
            "Correo": usuario_registrado["Correo"],
            "Contrasena": "Password123",
        },
    )
    assert resp.status_code == 400


def test_registro_contrasena_corta_falla(client):
    resp = client.post(
        "/auth/registro",
        json={
            "Nombre": "Corto",
            "Correo": "corto@test.com",
            "Contrasena": "abc",
        },
    )
    assert resp.status_code == 422


def test_login_exitoso_devuelve_tokens(client, usuario_registrado):
    resp = client.post(
        "/auth/login",
        json={
            "Correo": usuario_registrado["Correo"],
            "Contrasena": usuario_registrado["Contrasena"],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["usuario"]["Correo"] == usuario_registrado["Correo"]


def test_login_credenciales_incorrectas(client, usuario_registrado):
    resp = client.post(
        "/auth/login",
        json={
            "Correo": usuario_registrado["Correo"],
            "Contrasena": "ClaveErrada",
        },
    )
    assert resp.status_code == 401


def test_endpoint_protegido_requiere_token(client):
    resp = client.get("/bandas/mias")
    assert resp.status_code == 401


def test_token_invalido_es_rechazado(client):
    resp = client.get("/bandas/mias", headers={"Authorization": "Bearer no-es-jwt"})
    assert resp.status_code == 401


def test_refresh_token_emite_nuevo_par(client, usuario_registrado):
    login = client.post(
        "/auth/login",
        json={
            "Correo": usuario_registrado["Correo"],
            "Contrasena": usuario_registrado["Contrasena"],
        },
    )
    refresh = login.json()["refresh_token"]

    resp = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]


def test_refresh_con_access_token_falla(client, usuario_registrado):
    login = client.post(
        "/auth/login",
        json={
            "Correo": usuario_registrado["Correo"],
            "Contrasena": usuario_registrado["Contrasena"],
        },
    )
    access = login.json()["access_token"]
    resp = client.post("/auth/refresh", json={"refresh_token": access})
    assert resp.status_code == 401


def test_refresh_token_basura_falla(client):
    resp = client.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert resp.status_code == 401


def test_refresh_de_usuario_inexistente_falla(client):
    fake = create_refresh_token("inexistente@test.com")
    resp = client.post("/auth/refresh", json={"refresh_token": fake})
    assert resp.status_code == 401
