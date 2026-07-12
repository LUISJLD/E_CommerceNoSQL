"""
get_user_orders
───────────────
GET /user/{user_id}/orders  →  historial de órdenes de un usuario.

Consulta los ítems pk=USER#<id>, sk=ORDER#*.
"""
import os
import logging
from urllib.parse import unquote

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from shared.responses import cached_response, response
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

TTL = int(os.environ.get("CACHE_TTL_SECONDS", "60"))


def lambda_handler(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        user_id = unquote(path_params.get("user_id") or "")
        if not user_id:
            return response(400, {"error": "user_id requerido"})

        table = get_table()
        cache_key = f"user:orders:{user_id}"

        def _fetch():
            resp = table.query(
                KeyConditionExpression=Key("pk").eq(f"USER#{user_id}")
                & Key("sk").begins_with("ORDER#")
            )
            return resp.get("Items", [])

        result = cache_aside(cache_key, _fetch, TTL)

        return cached_response(200, result)

    except Exception as e:
        logging.exception("Error en get_user_orders")
        return response(500, {"error": f"Internal server error: {str(e)}"})
