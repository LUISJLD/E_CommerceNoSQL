import json
import logging
import hashlib
import os
import datetime

try:
    import jwt
except ImportError:
    # Si falla por alguna razón en local, creamos un dummy para que no rompa el syntax check
    jwt = None

from shared.dynamo_client import get_table
from shared.responses import response
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

JWT_SECRET = os.environ.get("JWT_SECRET", "mi_super_secreto_local_123")

def hash_password(password: str) -> str:
    # Usamos SHA-256 (en un entorno real usaríamos bcrypt o Argon2, pero esto no requiere compilar C)
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def _handle_register(table, body):
    email = body.get("email")
    password = body.get("password")
    name = body.get("name", "Usuario")

    if not email or not password:
        return response(400, {"error": "Se requieren email y password"})

    user_id = email.lower()
    pk = f"USER#{user_id}"

    # Verificar si ya existe
    resp = table.get_item(Key={"pk": pk, "sk": "PROFILE"})
    if "Item" in resp:
        return response(400, {"error": "El usuario ya existe"})

    # Guardar en DynamoDB
    table.put_item(Item={
        "pk": pk,
        "sk": "PROFILE",
        "email": user_id,
        "name": name,
        "passwordHash": hash_password(password),
        "role": "user" # Por defecto todos los registrados son users
    })

    return response(201, {"message": "Usuario registrado exitosamente"})

def _handle_login(table, body):
    if not jwt:
        return response(500, {"error": "Librería PyJWT no está instalada en Lambda"})

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return response(400, {"error": "Se requieren email y password"})

    user_id = email.lower()
    pk = f"USER#{user_id}"

    resp = table.get_item(Key={"pk": pk, "sk": "PROFILE"})
    user = resp.get("Item")

    if not user:
        return response(401, {"error": "Credenciales inválidas"})

    if user.get("passwordHash") != hash_password(password):
        return response(401, {"error": "Credenciales inválidas"})

    # Generar Token JWT
    payload = {
        "userId": user_id,
        "email": user_id,
        "role": user.get("role", "user"),
        "name": user.get("name", "Usuario"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    return response(200, {
        "message": "Login exitoso",
        "token": token,
        "user": {
            "email": user_id,
            "name": user.get("name"),
            "role": user.get("role", "user")
        }
    })

def lambda_handler(event, context):
    try:
        path = event.get("resource", "") or event.get("path", "")
        http_method = event.get("httpMethod", "")
        body = json.loads(event.get("body") or "{}")

        table = get_table()

        if http_method == "POST":
            if "register" in path:
                return _handle_register(table, body)
            elif "login" in path:
                return _handle_login(table, body)
            
        return response(404, {"error": "Ruta de autenticación no encontrada"})

    except Exception as e:
        logging.exception("Error en auth lambda")
        return response(500, {"error": f"Internal server error: {str(e)}"})
