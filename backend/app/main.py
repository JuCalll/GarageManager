from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app import models
from app.config import FRONTEND_ORIGINS
from app.database import engine
from app.rate_limit import limiter
from app.routers import (
    auth,
    bandas,
    eventos,
    finanzas,
    notas,
    notificaciones,
    repertorio,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Garantiza que las tablas existan al arrancar. En producción conviene
    # usar el `schema.sql` o las migraciones explícitas en `backend/migrations/`.
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Garage Manager API", version="1.3.0", lifespan=lifespan)

# Rate limiting global (slowapi). Cada endpoint declara su propio @limiter.limit.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bandas.router)
app.include_router(eventos.router)
app.include_router(finanzas.router)
app.include_router(notas.router)
app.include_router(notificaciones.router)
app.include_router(repertorio.router)


@app.get("/")
def health_check():
    return {
        "status": "success",
        "message": "Garage Manager API funcionando correctamente.",
    }
