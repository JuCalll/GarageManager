"""Tests del módulo de repertorio: canciones y setlists."""


def _cancion(banda_id, titulo="Tema 1", **extra):
    payload = {
        "BandaId": banda_id,
        "Titulo": titulo,
        "Tono": "Cm",
        "DuracionSegundos": 180,
        "Bpm": 120,
    }
    payload.update(extra)
    return payload


def test_crear_y_listar_cancion(client, banda_creada, headers_auth):
    resp = client.post(
        "/repertorio/canciones",
        json=_cancion(banda_creada["Id"]),
        headers=headers_auth,
    )
    assert resp.status_code == 201
    cancion = resp.json()
    assert cancion["Titulo"] == "Tema 1"

    listado = client.get(
        f"/repertorio/bandas/{banda_creada['Id']}/canciones",
        headers=headers_auth,
    ).json()
    assert len(listado) == 1


def test_actualizar_y_eliminar_cancion(client, banda_creada, headers_auth):
    crear = client.post(
        "/repertorio/canciones",
        json=_cancion(banda_creada["Id"]),
        headers=headers_auth,
    )
    cid = crear.json()["Id"]

    upd = client.put(
        f"/repertorio/canciones/{cid}",
        json={"Titulo": "Tema renombrado", "Bpm": 140},
        headers=headers_auth,
    )
    assert upd.status_code == 200
    assert upd.json()["Titulo"] == "Tema renombrado"
    assert upd.json()["Bpm"] == 140

    delete = client.delete(
        f"/repertorio/canciones/{cid}", headers=headers_auth
    )
    assert delete.status_code == 204


def test_crear_setlist_calcula_duracion(client, banda_creada, headers_auth):
    c1 = client.post(
        "/repertorio/canciones",
        json=_cancion(banda_creada["Id"], "A", DuracionSegundos=120),
        headers=headers_auth,
    ).json()
    c2 = client.post(
        "/repertorio/canciones",
        json=_cancion(banda_creada["Id"], "B", DuracionSegundos=180),
        headers=headers_auth,
    ).json()

    resp = client.post(
        "/repertorio/setlists",
        json={
            "BandaId": banda_creada["Id"],
            "Nombre": "Setlist debut",
            "Items": [
                {"CancionId": c1["Id"], "Orden": 0},
                {"CancionId": c2["Id"], "Orden": 1, "NotaInterpretacion": "Suave"},
            ],
        },
        headers=headers_auth,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["DuracionTotalSegundos"] == 300
    assert len(data["Items"]) == 2
    assert data["Items"][1]["NotaInterpretacion"] == "Suave"


def test_no_se_puede_agregar_cancion_de_otra_banda(
    client, banda_creada, headers_auth
):
    # Crear segunda banda
    otra = client.post(
        "/bandas/",
        json={"Nombre": "Otra", "Url": "otra"},
        headers=headers_auth,
    ).json()
    cancion_otra = client.post(
        "/repertorio/canciones",
        json=_cancion(otra["Id"], "Foránea"),
        headers=headers_auth,
    ).json()

    resp = client.post(
        "/repertorio/setlists",
        json={
            "BandaId": banda_creada["Id"],
            "Nombre": "Mezcla inválida",
            "Items": [{"CancionId": cancion_otra["Id"], "Orden": 0}],
        },
        headers=headers_auth,
    )
    assert resp.status_code == 400
