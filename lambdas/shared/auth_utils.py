import os
import logging
from shared.responses import response

try:
    import jwt
except ImportError:
    jwt = None

JWT_SECRET = os.environ.get("JWT_SECRET", "mi_super_secreto_local_123")

def get_user_from_event(event):
    """
    Extrae y valida el JWT desde los headers ('Authorization').
    Retorna el payload del usuario si es válido, de lo contrario None.
    """
    if not jwt:
        logging.warning("PyJWT no está instalado. Simulando auth para desarrollo.")
        # En caso extremo de no tener JWT en local, devolvemos admin por defecto 
        # (solo si quisieramos saltar seguridad, pero mejor fallar seguro)
        return None

    headers = event.get("headers") or {}
    # API Gateway suele enviar los headers en minúscula, pero buscamos ambos
    auth_header = headers.get("Authorization") or headers.get("authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logging.warning("Token expirado")
        return None
    except jwt.InvalidTokenError:
        logging.warning("Token inválido")
        return None

def require_admin(handler_func):
    """
    Decorador para proteger rutas y exigir rol 'admin'.
    """
    def wrapper(event, context):
        user = get_user_from_event(event)
        if not user or user.get("role") != "admin":
            return response(403, {"error": "Acceso denegado. Se requiere rol de administrador."})
        
        # Inyectamos el usuario en el evento para que el handler pueda usarlo
        event["user"] = user
        return handler_func(event, context)
    return wrapper

def require_auth(handler_func):
    """
    Decorador para proteger rutas y exigir estar logueado.
    """
    def wrapper(event, context):
        user = get_user_from_event(event)
        if not user:
            return response(401, {"error": "No autorizado. Inicie sesión."})
        
        event["user"] = user
        return handler_func(event, context)
    return wrapper
