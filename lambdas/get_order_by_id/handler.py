"""
get_order_by_id
───────────────
GET /orders/{order_id}  →  metadata de una orden.

Usa el GSI1 para localizar la orden por su ID:
gsi1pk=ORDER#<id>, gsi1sk=METADATA.
"""
import os
import logging

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from shared.responses import response
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

TTL = int(os.environ.get("CACHE_TTL_SECONDS", "60"))


def lambda_handler(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("order_id")
        if not order_id:
            return response(400, {"error": "order_id requerido"})

        table = get_table()
        cache_key = f"order:by_id:{order_id}"

        def _fetch():
            resp = table.query(
                IndexName="GSI1",
                KeyConditionExpression=Key("gsi1pk").eq(f"ORDER#{order_id}")
                & Key("gsi1sk").eq("METADATA"),
            )
            items = resp.get("Items", [])
            return items[0] if items else None

        result = cache_aside(cache_key, _fetch, TTL)
        data = result.get("data") if isinstance(result, dict) else result

        if not data:
            return response(404, {"error": "Orden no encontrada"})

        return response(200, data)

    except Exception as e:
        logging.exception("Error en get_order_by_id")
        return response(500, {"error": f"Internal server error: {str(e)}"})