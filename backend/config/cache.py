# config/cache.py
# Cliente Redis asíncrono para almacenamiento en caché

import os
import json
import logging
import asyncio
import redis.asyncio as aioredis
from typing import Callable, Any

logger = logging.getLogger(__name__)
_redis = None


def get_redis() -> Any:
    global _redis
    if _redis is None:
        url = os.environ.get("REDIS_URL")
        if not url:
            logger.warning("REDIS_URL no está configurada. Usando almacén en memoria simulado.")

            class _MemoryRedis:
                def __init__(self):
                    self.store = {}

                async def get(self, key):
                    return self.store.get(key)

                async def setex(self, key, ttl, value):
                    self.store[key] = value

                async def delete(self, key):
                    self.store.pop(key, None)

                async def ping(self):
                    return True

            _redis = _MemoryRedis()
        else:
            _redis = aioredis.from_url(
                url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
    return _redis


async def cache_aside(key: str, fetch_fn: Callable[[], Any], ttl: int = 60) -> dict:
    """
    Patrón Cache-Aside Asíncrono para FastAPI:
    1. Intenta leer de Redis.
    2. Si hay hit, retorna {"source": "CACHE", "data": ...}.
    3. Si hay miss, ejecuta fetch_fn(), guarda en Redis y retorna {"source": "DATABASE", "data": ...}.
    """
    r = get_redis()

    try:
        cached = await r.get(key)
        if cached is not None:
            logger.info(f"Cache HIT para la clave: {key}")
            return {
                "source": "CACHE",
                "data": json.loads(cached),
            }
    except Exception as e:
        logger.warning(f"Fallo al leer caché para {key}: {e}")

    logger.info(f"Cache MISS para la clave: {key} - consultando Base de Datos")
    
    if asyncio.iscoroutinefunction(fetch_fn):
        value = await fetch_fn()
    else:
        value = fetch_fn()

    try:
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"Fallo al escribir en caché para {key}: {e}")

    return {
        "source": "DATABASE",
        "data": value,
    }
