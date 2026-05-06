import redis, os, json, logging

logger = logging.getLogger(__name__)
_redis = None

def get_redis():
    global _redis
    if _redis is None:
        _redis = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/1'))
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