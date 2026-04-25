# Garage Manager

Aplicación web para que bandas independientes organicen **miembros**, **eventos**, **finanzas**, **notas internas** y **repertorio** (canciones y setlists), con **perfil público** y **notificaciones** en la propia app.

- **Frontend:** React (Vite) + Tailwind CSS — carpeta `frontend/`
- **Backend:** API REST con FastAPI — carpeta `backend/`
- **Base de datos:** MySQL o MariaDB (por ejemplo con XAMPP en Windows)

Esta guía está pensada para que **cualquier persona** pueda clonar el repositorio desde GitHub y dejar el proyecto corriendo en su máquina siguiendo los pasos en orden.

---

## 1. Qué necesitás instalado antes

| Software | Para qué sirve | Notas |
|----------|------------------|--------|
| **Git** | Clonar el repositorio | [git-scm.com](https://git-scm.com/) |
| **Python 3.11+** | Backend | Durante la instalación marcá “Add Python to PATH” |
| **Node.js 20+** (incluye npm) | Frontend | [nodejs.org](https://nodejs.org/) |
| **MySQL o MariaDB** | Base de datos | En la universidad suele usarse **XAMPP** (incluye MariaDB y phpMyAdmin) |

Comprobá en una terminal:

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

(Sustituí la URL por la de tu fork o repositorio real.)

---

## 3. Base de datos

1. **Iniciá el motor de base de datos** (en XAMPP: encender **MySQL**).

2. **Creá una base vacía** llamada `garage_manager`. Podés hacerlo desde **phpMyAdmin** (pestaña SQL):

   ```sql
   CREATE DATABASE garage_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Cargá el esquema completo** del proyecto: en phpMyAdmin seleccioná la base `garage_manager` → **Importar** → elegí el archivo:

   `backend/schema.sql`

   Ese script crea todas las tablas que la aplicación necesita. Si ya tenés tablas viejas con el mismo nombre, usá otra base o borrá la anterior con cuidado.

4. **Usuario y contraseña de MySQL:** por defecto en XAMPP el usuario suele ser `root` sin contraseña. Si usás otra combinación, la anotás en el `.env` del backend (paso siguiente).

---

## 4. Backend (API)

Abrir una terminal en la carpeta del proyecto.

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

Editá `backend/.env` y revisá al menos:

| Variable | Significado habitual |
|----------|----------------------|
| `DATABASE_URL` | Cadena de conexión SQLAlchemy. Por defecto apunta a `garage_manager` en `localhost:3306` con usuario `root` y sin contraseña. Ajustá usuario, contraseña y puerto si tu MySQL es distinto. |
| `SECRET_KEY` | Clave larga y aleatoria para firmar los tokens JWT. **No** dejes el valor de ejemplo en un servidor real. |
| `FRONTEND_ORIGINS` | Orígenes permitidos para CORS (el navegador donde corre Vite, por defecto `http://localhost:5173`). Si cambiás el puerto del frontend, actualizá esto. |

### 4.3 Arrancar el servidor

Con el entorno virtual activo y estando en `backend/`:

```bash
uvicorn main:app --reload
```

Deberías ver que escucha en el puerto **8000**. La documentación interactiva de la API está en:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)

Dejá esta terminal **abierta** mientras probás la app.

---

## 5. Frontend (interfaz web)

Abrí **otra** terminal, en la raíz del repositorio (o en `frontend/`).

### 5.1 Dependencias y entorno

```bash
cd frontend
npm install
copy .env.example .env
```

(En macOS/Linux: `cp .env.example .env`)

El archivo `frontend/.env` define `VITE_API_URL`. Por defecto apunta a `http://localhost:8000` (mismo host que el backend). Solo cambiá esto si la API corre en otro puerto o máquina.

### 5.2 Modo desarrollo

```bash
npm run dev
```

Vite suele levantar la app en [http://localhost:5173](http://localhost:5173). Abrí esa URL en el navegador.

---

## 6. Probar que todo funciona (flujo mínimo)

1. Con **MySQL** encendido, **backend** en `:8000` y **frontend** en `:5173`.
2. En el navegador: **Registrarse** con un correo y contraseña.
3. **Crear una banda** (nombre, URL pública, etc.).
4. Explorar **Eventos**, **Finanzas**, **Notas** según el informe de la asignatura.

Si algo falla, mirá la consola del backend (errores de conexión a la base suelen ser URL o credenciales incorrectas en `DATABASE_URL`).

### Build de producción (opcional)

Solo para comprobar que el frontend compila:

```bash
cd frontend
npm run build
```

Los archivos generados quedan en `frontend/dist/`. No hace falta para desarrollo diario.

---

## 7. Pruebas automatizadas del backend (opcional)

Con el entorno virtual del backend activo:

```bash
cd backend
pytest
```

En la PC del equipo, las pruebas usan SQLite en memoria (no reemplaza tener MySQL bien configurado para usar la app a mano). Si `pytest` no está, ya viene listado en `requirements.txt` tras `pip install -r requirements.txt`.

---

## 8. Estructura resumida del repositorio

```
GarageManager/
├── backend/
│   ├── main.py              # Arranque: uvicorn main:app
│   ├── schema.sql           # Esquema MySQL completo (usar con una base nueva)
│   ├── .env.example
│   ├── requirements.txt
│   └── app/                 # API FastAPI (routers, modelos, seguridad…)
├── frontend/
│   ├── package.json
│   ├── .env.example
│   └── src/                 # React: páginas, componentes, API cliente
└── README.md                # Este archivo
```

---

## 9. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| `Can't connect to MySQL` o error similar al arrancar el backend | MySQL encendido, base `garage_manager` creada, `DATABASE_URL` correcta (usuario, contraseña, puerto 3306). |
| El frontend carga pero no trae datos / error de red | Backend corriendo, `VITE_API_URL` apuntando al mismo host:puerto de la API, y en `FRONTEND_ORIGINS` del backend incluido el origen de Vite (p. ej. `http://localhost:5173`). |
| Página en blanco en el build | Eso se ve al usar `npm run build` y servir `dist/`; en desarrollo usá `npm run dev`. |
| Puerto 8000 u ocupado | Cerrá el otro proceso o cambiá el puerto de uvicorn (y actualizá `VITE_API_URL` si hace falta). |

---

## 10. Más documentación

El desarrollo académico (arquitectura, base de datos, decisiones) puede documentarse en el **informe de proyecto** de la asignatura; el código y los tests en el repositorio sirven como sustento.

---

*Proyecto académico — Garage Manager.*
