import redis, os, json, logging

logger = logging.getLogger(__name__)
_redis = None

def get_redis():
    global _redis
    if _redis is None:
        try:
            _redis = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/1'))
        except Exception as e:
            logger.warning("Redis connection failed (%s). Falling back to in‑memory store.", e)
            # Simple in‑memory mock with the subset of Redis commands we use
            class _MemoryRedis:
                def __init__(self):
                    self.store = {}
                def hset(self, key, field, value):
                    self.store.setdefault(key, {})[field] = value
                def hgetall(self, key):
                    return self.store.get(key, {})
                def hdel(self, key, field):
                    if key in self.store:
                        self.store[key].pop(field, None)
                def expire(self, key, ttl):
                    # No‑op for in‑memory store
                    pass
            _redis = _MemoryRedis()
    return _redis

def cache_aside(key: str, fetch_fn, ttl: int = 60):
    r = get_redis()
    try:
        cached = r.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        logger.warning("Cache read failed %s: %s", key, e)

    value = fetch_fn()

    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning("Cache write failed %s: %s", key, e)

    return value