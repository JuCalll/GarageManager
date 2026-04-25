"""Tests del módulo financiero: registros y balance individual."""

from datetime import date


def _registro(banda_id, **extra):
    payload = {
        "BandaId": banda_id,
        "Tipo": "ingreso",
        "Monto": 100,
        "Descripcion": "Toque",
        "Fecha": date.today().isoformat(),
        "Estado": "cobrado",
    }
    payload.update(extra)
    return payload


def test_crear_y_listar_ingreso(client, banda_creada, headers_auth):
    resp = client.post(
        "/finanzas/",
        json=_registro(banda_creada["Id"]),
        headers=headers_auth,
    )
    assert resp.status_code == 201

    listado = client.get(
        f"/finanzas/banda/{banda_creada['Id']}", headers=headers_auth
    ).json()
    assert len(listado) == 1


def test_balance_calcula_pendientes_y_saldo(client, banda_creada, headers_auth):
    # 200 cobrado + 50 pendiente + 30 gasto cobrado.
    client.post(
        "/finanzas/",
        json=_registro(banda_creada["Id"], Monto=200, Estado="cobrado"),
        headers=headers_auth,
    )
    client.post(
        "/finanzas/",
        json=_registro(banda_creada["Id"], Monto=50, Estado="pendiente"),
        headers=headers_auth,
    )
    client.post(
        "/finanzas/",
        json=_registro(
            banda_creada["Id"],
            Tipo="gasto",
            Monto=30,
            Categoria="sonido",
            Estado="cobrado",
        ),
        headers=headers_auth,
    )

    balance = client.get(
        f"/finanzas/banda/{banda_creada['Id']}/balance", headers=headers_auth
    ).json()
    assert float(balance["TotalIngresos"]) == 200
    assert float(balance["IngresosPendientes"]) == 50
    assert float(balance["TotalGastos"]) == 30
    assert float(balance["Saldo"]) == 170


def test_actualizar_registro_persiste_todos_los_campos(
    client, banda_creada, headers_auth
):
    crear = client.post(
        "/finanzas/",
        json=_registro(banda_creada["Id"]),
        headers=headers_auth,
    )
    rid = crear.json()["Id"]

    upd = client.put(
        f"/finanzas/{rid}",
        json={
            "Monto": 999,
            "Tipo": "gasto",
            "Categoria": "transporte",
            "Estado": "pendiente",
            "Descripcion": "Bus",
        },
        headers=headers_auth,
    )
    assert upd.status_code == 200
    data = upd.json()
    assert float(data["Monto"]) == 999
    assert data["Tipo"] == "gasto"
    assert data["Categoria"] == "transporte"
    assert data["Estado"] == "pendiente"


def test_eliminar_registro(client, banda_creada, headers_auth):
    crear = client.post(
        "/finanzas/",
        json=_registro(banda_creada["Id"]),
        headers=headers_auth,
    )
    rid = crear.json()["Id"]
    resp = client.delete(f"/finanzas/{rid}", headers=headers_auth)
    assert resp.status_code == 204
