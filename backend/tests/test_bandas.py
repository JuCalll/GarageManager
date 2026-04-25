"""Tests del módulo de bandas: CRUD, miembros, redes, perfil público."""


def test_crear_banda_creador_es_admin(client, headers_auth):
    resp = client.post(
        "/bandas/",
        json={
            "Nombre": "Mi Banda",
            "Url": "mi-banda",
            "Genero": "Punk",
        },
        headers=headers_auth,
    )
    assert resp.status_code == 201
    banda_id = resp.json()["Id"]

    miembros = client.get(
        f"/bandas/{banda_id}/miembros", headers=headers_auth
    ).json()
    assert len(miembros) == 1
    assert miembros[0]["EsAdministrador"] is True


def test_url_banda_duplicada_falla(client, banda_creada, headers_auth):
    resp = client.post(
        "/bandas/",
        json={"Nombre": "Otra", "Url": banda_creada["Url"]},
        headers=headers_auth,
    )
    assert resp.status_code == 400


def test_perfil_publico_no_requiere_token(client, banda_creada):
    resp = client.get(f"/bandas/publico/{banda_creada['Url']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["Nombre"] == banda_creada["Nombre"]
    assert "Redes" in data
    assert "ProximosEventos" in data


def test_perfil_publico_inexistente_404(client):
    resp = client.get("/bandas/publico/no-existe")
    assert resp.status_code == 404


def test_actualizar_banda(client, banda_creada, headers_auth):
    resp = client.put(
        f"/bandas/{banda_creada['Id']}",
        json={"Descripcion": "Nueva descripción", "Genero": "Metal"},
        headers=headers_auth,
    )
    assert resp.status_code == 200
    assert resp.json()["Descripcion"] == "Nueva descripción"


def test_agregar_red_social(client, banda_creada, headers_auth):
    resp = client.post(
        f"/bandas/{banda_creada['Id']}/redes",
        json={"Plataforma": "Instagram", "Url": "https://instagram.com/x"},
        headers=headers_auth,
    )
    assert resp.status_code == 201

    redes = client.get(
        f"/bandas/{banda_creada['Id']}/redes", headers=headers_auth
    ).json()
    assert len(redes) == 1
    assert redes[0]["Plataforma"] == "Instagram"


def test_no_admin_no_puede_invitar(client, banda_creada, headers_auth):
    # Registrar otro usuario y obtener su token.
    client.post(
        "/auth/registro",
        json={
            "Nombre": "Visitante",
            "Correo": "visitante@test.com",
            "Contrasena": "Password123",
        },
    )
    token_visit = client.post(
        "/auth/login",
        json={"Correo": "visitante@test.com", "Contrasena": "Password123"},
    ).json()["access_token"]
    headers_visit = {"Authorization": f"Bearer {token_visit}"}

    resp = client.post(
        f"/bandas/{banda_creada['Id']}/miembros",
        json={"Correo": "otro@test.com", "Rol": "Bajo"},
        headers=headers_visit,
    )
    assert resp.status_code == 403
