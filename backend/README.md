# Garage Manager · Backend

API REST construida con **FastAPI + SQLAlchemy + MySQL** para gestionar bandas emergentes: autenticación, eventos, finanzas, notas y notificaciones.

## Stack

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2.x + PyMySQL
- Passlib (bcrypt_sha256) + python-jose (JWT)
- Pydantic v2

## Puesta en marcha

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # Ajusta DATABASE_URL y SECRET_KEY
```

### Base de datos

1. Crear la base `garage_manager` en XAMPP.
2. **Instalación limpia**: ejecutar `schema.sql` (crea todas las tablas desde cero).
3. **Base existente**: ejecutar en orden los scripts de `migrations/`:
   - `001_esquema_completo.sql` · añade columnas/tablas que falten.
   - `002_fix_tablas_nuevas.sql` · corrige `Redes_Sociales` y `Notificaciones` si se crearon parcialmente.
   - `003_fix_notificaciones_tipo.sql` · fuerza el ENUM correcto en `Notificaciones.Tipo`.

   Todos los scripts son idempotentes, pueden re-ejecutarse sin efectos secundarios.

### Ejecutar

```bash
uvicorn main:app --reload
```

Documentación interactiva: http://localhost:8000/docs

## Estructura

```
backend/
├── main.py                   # Entry point (re-exporta app.main:app)
├── schema.sql                # Esquema relacional completo
├── migrations/               # ALTER idempotentes sobre bases existentes
└── app/
    ├── main.py               # Instancia FastAPI + CORS + routers
    ├── config.py             # Variables de entorno
    ├── database.py           # Engine + SessionLocal + get_db
    ├── security.py           # Hashing + JWT
    ├── models.py             # ORM (SQLAlchemy)
    ├── schemas.py            # Pydantic
    ├── services/
    │   └── notificaciones.py # Lógica de notificaciones (REQ-05 RNF)
    └── routers/
        ├── auth.py           # Registro, login, get_current_user
        ├── bandas.py         # CRUD banda + miembros + redes + perfil público
        ├── eventos.py        # CRUD eventos
        ├── finanzas.py       # CRUD + balance global e individual
        ├── notas.py          # CRUD notas (fijables)
        └── notificaciones.py # Listado, marcar leídas
```

## Cobertura de requisitos del informe

| Requisito | Cubierto por |
|-----------|--------------|
| REQ-01 Registro/login | `routers/auth.py` |
| REQ-02 Crear banda + miembros con rol | `POST /bandas`, `POST /bandas/{id}/miembros` |
| REQ-03 Perfil público con redes | `GET /bandas/publico/{url}`, `routers/bandas.py` (redes) |
| REQ-04 Eventos completos | `routers/eventos.py` (incluye `Notas`) |
| REQ-05 Calendario + notificaciones 48h | Frontend + `services/notificaciones.py` |
| REQ-06 Dashboard | Frontend consume `/eventos`, `/finanzas/balance`, `/notas`, `/notificaciones` |
| REQ-07 Ingresos con estado | `Estado` en `Finanzas` (pendiente/cobrado) |
| REQ-08 Gastos con categoría + responsable | `Categoria`, `UsuarioPagoId`, `Estado` |
| REQ-09 Balance global + por miembro | `GET /finanzas/banda/{id}/balance` |
| REQ-10 Notas fijables | Campo `Fijada` en `Notas` |
