from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import LOGIN_RATE_LIMIT
from app.database import get_db
from app.rate_limit import limiter
from app.security import (
    create_access_token,
    create_refresh_token,
    get_subject_from_token,
    hash_password,
    verify_password,
)


router = APIRouter(prefix="/auth", tags=["Autenticación"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def buscar_usuario_por_correo(db: Session, correo: str) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.Correo == correo).first()


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Usuario:
    try:
        correo = get_subject_from_token(token, expected_type="access")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    usuario = buscar_usuario_por_correo(db, correo)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
        )
    return usuario


@router.post(
    "/registro",
    response_model=schemas.UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = buscar_usuario_por_correo(db, usuario.Correo)
    if usuario_existente:
        raise HTTPException(
            status_code=400, detail="El correo ya está registrado en Garage Manager"
        )

    nuevo_usuario = models.Usuario(
        Nombre=usuario.Nombre,
        Correo=usuario.Correo,
        Contrasena=hash_password(usuario.Contrasena),
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.post("/login", response_model=schemas.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit(LOGIN_RATE_LIMIT)
def iniciar_sesion(
    request: Request,
    credenciales: schemas.UsuarioLogin,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario_por_correo(db, credenciales.Correo)

    if not usuario or not verify_password(credenciales.Contrasena, usuario.Contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    return {
        "access_token": create_access_token(subject=usuario.Correo),
        "refresh_token": create_refresh_token(subject=usuario.Correo),
        "token_type": "bearer",
        "usuario": usuario,
    }


@router.post(
    "/refresh",
    response_model=schemas.TokenRefreshResponse,
    status_code=status.HTTP_200_OK,
)
def refrescar_token(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    """Emite un nuevo par de tokens a partir de un refresh token válido."""

    try:
        correo = get_subject_from_token(payload.refresh_token, expected_type="refresh")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado",
        )

    usuario = buscar_usuario_por_correo(db, correo)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return {
        "access_token": create_access_token(subject=correo),
        "refresh_token": create_refresh_token(subject=correo),
        "token_type": "bearer",
    }
