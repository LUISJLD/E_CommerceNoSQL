"""
get_products
────────────
GET /products                    →  catálogo completo.
GET /products?category=<cat>     →  catálogo filtrado por categoría.

Consulta los ítems pk=CATALOG#main, sk=PRODUCT#*.

Sobre el filtrado por categoría:
El catálogo completo se trae siempre con un query y se filtra en memoria.
Cada categoría cachea su propia copia bajo la clave products:cat:<cat>,
así que tras el primer hit las siguientes peticiones de esa categoría
salen de Redis sin tocar DynamoDB.

En AWS real, con un catálogo grande, lo correcto sería un GSI con
gsi1pk=CATEGORY#<cat> para no escanear todo. Para LocalStack y un dataset
de demo, el filtro en memoria es suficiente y más simple.
"""
import os
import logging
import unicodedata

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from shared.responses import response
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

TTL = int(os.environ.get("CACHE_TTL_SECONDS", "60"))


def _normalize(text: str) -> str:
    """
    Normaliza una categoría para comparar sin distinguir mayúsculas ni acentos.
    "Electrónica" y "electronica" se vuelven ambas "electronica".
    """
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.strip().lower()


def lambda_handler(event, context):
    try:
        query_params = event.get("queryStringParameters") or {}
        category = query_params.get("category")
        # Normaliza: ?category= vacío se trata como sin filtro
        if category is not None:
            category = category.strip() or None

        table = get_table()
        cache_key = f"products:cat:{category}" if category else "products:all"

        def _fetch():
            items = []
            query_kwargs = {
                "KeyConditionExpression": Key("pk").eq("CATALOG#main")
                & Key("sk").begins_with("PRODUCT#")
            }
            resp = table.query(**query_kwargs)
            items.extend(resp.get("Items", []))
            while "LastEvaluatedKey" in resp:
                query_kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
                resp = table.query(**query_kwargs)
                items.extend(resp.get("Items", []))

            if category:
                cat_norm = _normalize(category)
                items = [
                    it for it in items
                    if _normalize(it.get("category", "")) == cat_norm
                ]
            return items

        result = cache_aside(cache_key, _fetch, TTL)
        data = result.get("data", []) if isinstance(result, dict) else result

        return response(200, data)

    except Exception as e:
        logging.exception("Error en get_products")
        return response(500, {"error": f"Internal server error: {str(e)}"})