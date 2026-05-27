"""
get_user_profile
────────────────
GET /users/{user_id}        →  perfil de un usuario.
GET /user/{user_id}/profile →  misma función (ruta alterna del API).

Lee el ítem pk=USER#<id>, sk=PROFILE.
"""
import os
import logging

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from shared.responses import response

logging.getLogger().setLevel(logging.INFO)

TTL = int(os.environ.get("CACHE_TTL_SECONDS", "60"))


def lambda_handler(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("user_id")
        if not user_id:
            return response(400, {"error": "user_id requerido"})

        table = get_table()
        cache_key = f"user:profile:{user_id}"

        def _fetch():
            resp = table.get_item(Key={"pk": f"USER#{user_id}", "sk": "PROFILE"})
            return resp.get("Item")

        result = cache_aside(cache_key, _fetch, TTL)
        data = result.get("data") if isinstance(result, dict) else result

        if not data:
            return response(404, {"error": "Perfil no encontrado"})

        return response(200, data)

    except Exception as e:
        logging.exception("Error en get_user_profile")
        return response(500, {"error": f"Internal server error: {str(e)}"})