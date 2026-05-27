import redis
import os
import json
import logging

logger = logging.getLogger(__name__)
_redis = None


def get_redis():
    global _redis
    if _redis is None:
        try:
            _redis = redis.from_url(
                os.environ.get("REDIS_URL", "redis://localhost:6379/1"),
                decode_responses=True,
            )
            _redis.ping()
        except Exception as e:
            logger.warning(
                "Redis connection failed (%s). Falling back to in-memory store.", e
            )

            class _MemoryRedis:
                def __init__(self):
                    self.store = {}

                def get(self, key):
                    return self.store.get(key)

                def setex(self, key, ttl, value):
                    self.store[key] = value

                def delete(self, key):
                    self.store.pop(key, None)

                def ping(self):
                    return True

            _redis = _MemoryRedis()
    return _redis


def cache_aside(key: str, fetch_fn, ttl: int = 60):
    """
    Patrón Cache-Aside:
    1. Intenta leer de Redis.
    2. Si hay hit, retorna {source: "CACHE", data: ...}.
    3. Si hay miss, ejecuta fetch_fn(), guarda en Redis y retorna {source: "DATABASE", data: ...}.
    """
    r = get_redis()

    try:
        cached = r.get(key)
        if cached:
            logger.info("Cache HIT for key: %s", key)
            return {
                "source": "CACHE",
                "data": json.loads(cached),
            }
    except Exception as e:
        logger.warning("Cache read failed for key %s: %s", key, e)

    logger.info("Cache MISS for key: %s — fetching from DynamoDB", key)
    value = fetch_fn()

    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning("Cache write failed for key %s: %s", key, e)

    return {
        "source": "DATABASE",
        "data": value,
    }
