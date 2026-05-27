"""
get_all_users
─────────────
GET /users  →  lista todos los perfiles de usuario.

Escanea la tabla buscando ítems pk=USER#*, sk=PROFILE.
NOTA: scan() es costoso en AWS real; aquí es aceptable porque el dataset
es pequeño y estamos en LocalStack. En producción se usaría un GSI.
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

        def _fetch():
            items = []
            scan_kwargs = {
                "FilterExpression": Attr("pk").begins_with("USER#") & Attr("sk").eq("PROFILE")
            }
            resp = table.scan(**scan_kwargs)
            items.extend(resp.get("Items", []))
            while "LastEvaluatedKey" in resp:
                scan_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
                resp = table.scan(**scan_kwargs)
                items.extend(resp.get("Items", []))
            return items

        result = cache_aside("users:all_profiles", _fetch, TTL)
        data = result.get("data", []) if isinstance(result, dict) else result

        users = [
            {"userId": item.get("pk", "").replace("USER#", ""), **item}
            for item in data
        ]
        return response(200, users)

    except Exception as e:
        logging.exception("Error en get_all_users")
        return response(500, {"error": f"Internal server error: {str(e)}"})