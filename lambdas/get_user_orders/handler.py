"""
get_user_orders
───────────────
GET /user/{user_id}/orders  →  historial de órdenes de un usuario.

Consulta los ítems pk=USER#<id>, sk=ORDER#*.

NOTA: la versión anterior incluía lógica de carrito (_fetch_cart) que NUNCA
se ejecutaba — el API enruta /cart a la Lambda manage_cart, no a esta.
Ese código muerto se eliminó. El carrito vive solo en manage_cart/handler.py.
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
        user_id = path_params.get("user_id")
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
        data = result.get("data", []) if isinstance(result, dict) else result

        return response(200, data)

    except Exception as e:
        logging.exception("Error en get_user_orders")
        return response(500, {"error": f"Internal server error: {str(e)}"})