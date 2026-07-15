# config/database.py
# Conexión singleton a MongoDB Atlas usando Motor (driver async)
import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError("MONGO_URI no está definida en las variables de entorno")
        _client = AsyncIOMotorClient(uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    client = get_client()
    # El nombre de la DB viene incluido en la URI (ecommerce)
    return client.get_default_database()
