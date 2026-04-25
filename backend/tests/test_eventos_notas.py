"""Tests de eventos y notas internas."""

from datetime import date, timedelta


def _payload_evento(banda_id, dias=7):
    fecha = date.today() + timedelta(days=dias)
    return {
        "BandaId": banda_id,
        "Nombre": "Concierto Plaza Mayor",
        "Fecha": fecha.isoformat(),
        "Hora": "20:00",
        "Lugar": "Plaza Mayor",
        "Direccion": "Centro",
        "CondicionPago": "remunerado",
        "ContactoOrganizador": "Juan",
        "Notas": "Llevar amplificadores",
    }


def test_crear_y_listar_evento(client, banda_creada, headers_auth):
    resp = client.post(
        "/eventos/",
        json=_payload_evento(banda_creada["Id"]),
        headers=headers_auth,
    )
    assert resp.status_code == 201
    evento = resp.json()
    assert evento["Notas"] == "Llevar amplificadores"

    listado = client.get(
        f"/eventos/banda/{banda_creada['Id']}", headers=headers_auth
    ).json()
    assert len(listado) == 1


def test_crear_evento_genera_notificacion(client, banda_creada, headers_auth):
    client.post(
        "/eventos/",
        json=_payload_evento(banda_creada["Id"]),
        headers=headers_auth,
    )
    notifs = client.get("/notificaciones/", headers=headers_auth).json()
    assert any(n["Tipo"] == "evento_creado" for n in notifs)


def test_actualizar_y_eliminar_evento(client, banda_creada, headers_auth):
    crear = client.post(
        "/eventos/",
        json=_payload_evento(banda_creada["Id"]),
        headers=headers_auth,
    )
    evento_id = crear.json()["Id"]

    upd = client.put(
        f"/eventos/{evento_id}",
        json={"Lugar": "Estadio"},
        headers=headers_auth,
    )
    assert upd.status_code == 200
    assert upd.json()["Lugar"] == "Estadio"

    delete = client.delete(f"/eventos/{evento_id}", headers=headers_auth)
    assert delete.status_code == 204


def test_crud_notas(client, banda_creada, headers_auth):
    # Crear
    resp = client.post(
        "/notas/",
        json={
            "BandaId": banda_creada["Id"],
            "Contenido": "Acuerdo importante",
            "Fijada": True,
        },
        headers=headers_auth,
    )
    assert resp.status_code == 201
    nota_id = resp.json()["Id"]

    # Listar (la fijada debe venir primero)
    notas = client.get(
        f"/notas/banda/{banda_creada['Id']}", headers=headers_auth
    ).json()
    assert notas[0]["Fijada"] is True

    # Actualizar
    upd = client.put(
        f"/notas/{nota_id}",
        json={"Fijada": False},
        headers=headers_auth,
    )
    assert upd.status_code == 200
    assert upd.json()["Fijada"] is False

    # Eliminar
    delete = client.delete(f"/notas/{nota_id}", headers=headers_auth)
    assert delete.status_code == 204
