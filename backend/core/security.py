# core/security.py
# Hashing de contraseñas (SHA-256) y generación/validación de JWT
# Misma lógica que estaba en auth/handler.py y shared/auth_utils.py

import hashlib
import os
import datetime
import logging

import jwt

JWT_SECRET = os.environ.get("JWT_SECRET", "mi_super_secreto_local_123")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_token(user: dict) -> str:
    payload = {
        "userId": user["email"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "name": user.get("name", "Usuario"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logging.warning("Token expirado")
        return None
    except jwt.InvalidTokenError:
        logging.warning("Token inválido")
        return None
