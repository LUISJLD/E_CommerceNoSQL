"""
get_order_items
───────────────
GET /orders/{order_id}/items  →  líneas de producto de una orden.

Consulta los ítems pk=ORDER#<id>, sk=ITEM#*.
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
        order_id = unquote(path_params.get("order_id") or "")
        if not order_id:
            return response(400, {"error": "order_id requerido"})

        table = get_table()
        cache_key = f"order:items:{order_id}"

        def _fetch():
            resp = table.query(
                KeyConditionExpression=Key("pk").eq(f"ORDER#{order_id}")
                & Key("sk").begins_with("ITEM#")
            )
            return resp.get("Items", [])

        result = cache_aside(cache_key, _fetch, TTL)

        return cached_response(200, result)

    except Exception as e:
        logging.exception("Error en get_order_items")
        return response(500, {"error": f"Internal server error: {str(e)}"})
