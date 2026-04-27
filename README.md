# Garage Manager

Aplicación web para que bandas independientes organicen **miembros**, **eventos**, **finanzas**, **notas internas** y **repertorio** (canciones y setlists), con **perfil público** y **notificaciones** en la propia app.

- **Frontend:** React (Vite) + Tailwind CSS — carpeta `frontend/`
- **Backend:** API REST con FastAPI — carpeta `backend/`
- **Base de datos:** MySQL o MariaDB (por ejemplo con XAMPP en Windows)

Esta guía está pensada para que **cualquier persona** pueda clonar el repositorio desde GitHub y tener el proyecto en ejecución en su equipo siguiendo los pasos en orden.

---

## 1. Requisitos previos

| Software | Uso | Notas |
|----------|-----|--------|
| **Git** | Clonar el repositorio | [git-scm.com](https://git-scm.com/) |
| **Python 3.11+** | Backend | En la instalación, active la opción “Add Python to PATH” (Windows) |
| **Node.js 20+** (incluye npm) | Frontend | [nodejs.org](https://nodejs.org/) |
| **MySQL o MariaDB** | Base de datos | En entornos académicos suele usarse **XAMPP** (incluye MariaDB y phpMyAdmin) |

Compruebe en una terminal:

```bash
python --version
node --version
npm --version
```

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

(Sustituya la URL por la de su fork o repositorio real.)

---

## 3. Base de datos

1. **Inicie el motor de base de datos** (en XAMPP: inicie el servicio **MySQL**).

2. **Cree una base vacía** llamada `garage_manager`. Puede hacerlo desde **phpMyAdmin** (pestaña SQL):

   ```sql
   CREATE DATABASE garage_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Importe el esquema completo** del proyecto: en phpMyAdmin seleccione la base `garage_manager` → **Importar** → elija el archivo:

   `backend/schema.sql`

   Ese script crea todas las tablas que la aplicación necesita. Si ya existen tablas con el mismo nombre, use otra base de datos o elimine la anterior con cuidado.

   *Alternativa (scripts separados):* en `backend/sql/` existen `01_creacion_tablas.sql` (solo tablas) y `02_datos_prueba.sql` (registros de ejemplo, usuarios demo y relaciones). Puede importarlos en ese orden; el segundo incluye la contraseña de prueba en el comentario inicial del archivo.

4. **Usuario y contraseña de MySQL:** por defecto en XAMPP el usuario suele ser `root` sin contraseña. Si usa otra combinación, regístrela en el `.env` del backend (paso siguiente).

---

## 4. Backend (API)

Abra una terminal en la carpeta del proyecto.

### 4.1 Entorno virtual e instalación

**Windows (PowerShell o CMD):**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Variables de entorno

```bash
copy .env.example .env
```

En **Windows** con CMD: `copy .env.example .env`  
En PowerShell también funciona `Copy-Item .env.example .env`

Edite `backend/.env` y revise al menos lo siguiente:

| Variable | Uso habitual |
|----------|--------------|
| `DATABASE_URL` | Cadena de conexión SQLAlchemy. Por defecto apunta a `garage_manager` en `localhost:3306` con usuario `root` y sin contraseña. Ajuste usuario, contraseña y puerto si su MySQL es distinto. |
| `SECRET_KEY` | Clave larga y aleatoria para firmar los tokens JWT. **No** deje el valor de ejemplo en un servidor real. |
| `FRONTEND_ORIGINS` | Orígenes permitidos para CORS (navegador donde corre Vite, por defecto `http://localhost:5173`). Si cambia el puerto del frontend, actualice este valor. |

### 4.3 Iniciar el servidor

Con el entorno virtual activo y estando en `backend/`:

```bash
uvicorn main:app --reload
```

Debería mostrarse que el servicio escucha en el puerto **8000**. La documentación interactiva de la API está en:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)

Mantenga esta terminal **abierta** mientras prueba la aplicación.

---

## 5. Frontend (interfaz web)

Abra **otra** terminal, en la raíz del repositorio (o en `frontend/`).

### 5.1 Dependencias y entorno

```bash
cd frontend
npm install
copy .env.example .env
```

(En macOS/Linux: `cp .env.example .env`)

El archivo `frontend/.env` define `VITE_API_URL`. Por defecto apunta a `http://localhost:8000` (mismo host que el backend). Cámbielo solo si la API corre en otro puerto o en otra máquina.

### 5.2 Modo desarrollo

```bash
npm run dev
```

Vite suele publicar la app en [http://localhost:5173](http://localhost:5173). Abra esa URL en el navegador.

---

## 6. Probar que todo funciona (flujo mínimo)

1. Con **MySQL** en ejecución, **backend** en `:8000` y **frontend** en `:5173`.
2. En el navegador: **Registrarse** con un correo y contraseña.
3. **Crear una banda** (nombre, URL pública, etc.).
4. Recorra **Eventos**, **Finanzas**, **Notas** según el informe de la asignatura.

Si algo falla, consulte la consola del backend (los errores de conexión a la base suelen deberse a `DATABASE_URL` o credenciales incorrectas).

### Compilación de producción (opcional)

Solo para comprobar que el frontend compila:

```bash
cd frontend
npm run build
```

Los archivos generados quedan en `frontend/dist/`. No es necesario para el trabajo diario en desarrollo.

---

## 7. Pruebas automatizadas del backend (opcional)

Con el entorno virtual del backend activo:

```bash
cd backend
pytest
```

En la computadora de desarrollo, las pruebas usan SQLite en memoria; eso no sustituye tener MySQL bien configurado para usar la aplicación manualmente. El paquete `pytest` ya está en `requirements.txt` después de `pip install -r requirements.txt`.

---

## 8. Estructura resumida del repositorio

```
GarageManager/
├── backend/
│   ├── main.py              # Arranque: uvicorn main:app
│   ├── schema.sql         # Esquema MySQL completo (usar con una base nueva)
│   ├── .env.example
│   ├── requirements.txt
│   └── app/                 # API FastAPI (routers, modelos, seguridad…)
├── frontend/
│   ├── package.json
│   ├── .env.example
│   └── src/                 # React: páginas, componentes, cliente API
└── README.md                # Este archivo
```

---

## 9. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| `Can't connect to MySQL` o error similar al arrancar el backend | MySQL en ejecución, base `garage_manager` creada, `DATABASE_URL` correcta (usuario, contraseña, puerto 3306). |
| El frontend carga pero no trae datos / error de red | Backend en ejecución, `VITE_API_URL` apuntando al mismo host:puerto de la API, y en `FRONTEND_ORIGINS` del backend el origen de Vite (p. ej. `http://localhost:5173`). |
| Página en blanco con el build | Ocurre al usar `npm run build` y servir `dist/`; en desarrollo use `npm run dev`. |
| Puerto 8000 u ocupado | Cierre el otro proceso o cambie el puerto de uvicorn (y ajuste `VITE_API_URL` si aplica). |

---

## 10. Más documentación

El desarrollo académico (arquitectura, base de datos, decisiones) puede documentarse en el **informe de proyecto** de la asignatura; el código y las pruebas en el repositorio sirven como sustento.

---

*Proyecto académico — Garage Manager.*
