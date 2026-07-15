# core/dependencies.py
# FastAPI dependencies para proteger rutas con JWT
# Reemplaza los decoradores @require_admin y @require_auth de auth_utils.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Extrae y valida el JWT. Retorna el payload o lanza 401."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    return payload


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Exige rol 'admin'. Lanza 403 si no cumple."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de administrador.",
        )
    return user
