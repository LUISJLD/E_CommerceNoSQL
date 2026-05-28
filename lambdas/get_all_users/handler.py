"""
get_all_users
─────────────
GET /users  →  lista de todos los usuarios registrados.

Escanea la tabla filtrando sk=PROFILE y omite passwordHash de la respuesta.
"""
import os
import logging

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from shared.responses import response
from boto3.dynamodb.conditions import Attr

logging.getLogger().setLevel(logging.INFO)

TTL = int(os.environ.get("CACHE_TTL_SECONDS", "60"))


def lambda_handler(event, context):
    try:
        table = get_table()
        cache_key = "all_users"

        def _fetch():
            items = []
            scan_kwargs = {
                "FilterExpression": Attr("sk").eq("PROFILE")
            }
            resp = table.scan(**scan_kwargs)
            items.extend(resp.get("Items", []))
            while "LastEvaluatedKey" in resp:
                scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
                resp = table.scan(**scan_kwargs)
                items.extend(resp.get("Items", []))

            for item in items:
                item.pop("passwordHash", None)
            return items

        result = cache_aside(cache_key, _fetch, TTL)
        data = result.get("data", []) if isinstance(result, dict) else result

        return response(200, data)

    except Exception as e:
        logging.exception("Error en get_all_users")
        return response(500, {"error": f"Internal server error: {str(e)}"})
