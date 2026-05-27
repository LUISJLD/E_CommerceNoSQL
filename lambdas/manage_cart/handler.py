"""
manage_cart
───────────
Gestiona el carrito de compras de un usuario. Es la pieza central del
requisito de "cache aplicada al carrito".

  GET    /cart/{user_id}                      →  lee el carrito (cache-aside)
  POST   /cart/{user_id}                      →  agrega/incrementa un producto
  DELETE /cart/{user_id}?productId=<id>       →  elimina un producto

Modelo de datos (ítems separados — un ítem de DynamoDB por producto):
  pk = USER#<user_id>
  sk = CART#<product_id>
  atributos: qty (Number), price (Number)

Estrategia de cache (cache-aside):
  - GET lee de Redis bajo la clave cart:<user_id>; si hay miss, lee
    DynamoDB y repuebla Redis con TTL = CART_TTL_SECONDS.
  - POST y DELETE INVALIDAN la clave (delete en Redis), de modo que
    el siguiente GET refleja el estado real desde DynamoDB.

Si Redis no está disponible, cache_client cae a un store en memoria,
así que el carrito sigue funcionando (lee siempre de DynamoDB).
"""
import os
import json
import logging
from decimal import Decimal

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside, get_redis
from shared.responses import response, no_content
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

CART_TTL = int(os.environ.get("CART_TTL_SECONDS", "300"))


def _invalidate(user_id: str):
    """Borra la entrada de cache del carrito. Nunca lanza excepción."""
    try:
        get_redis().delete(f"cart:{user_id}")
    except Exception as e:
        logging.warning("No se pudo invalidar cache de cart:%s: %s", user_id, e)


def _handle_get(table, user_id):
    cache_key = f"cart:{user_id}"

    def _fetch():
        resp = table.query(
            KeyConditionExpression=Key("pk").eq(f"USER#{user_id}")
            & Key("sk").begins_with("CART#")
        )
        items = resp.get("Items", [])
        return [
            {
                "productId": it["sk"].replace("CART#", ""),
                "qty": int(it.get("qty", 0)),
                "price": float(it.get("price", 0)),
            }
            for it in items
        ]

    result = cache_aside(cache_key, _fetch, CART_TTL)
    data = result.get("data", []) if isinstance(result, dict) else result
    return response(200, data)


def _handle_post(table, user_id, event):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "Cuerpo JSON inválido"})

    product_id = body.get("productId")
    qty = body.get("qty")
    price = body.get("price")

    if not product_id or qty is None or price is None:
        return response(400, {"error": "Se requieren productId, qty y price"})

    try:
        qty_dec = int(qty)
        # str() intermedio evita problemas de precisión de float -> Decimal
        price_dec = Decimal(str(price))
    except (ValueError, TypeError):
        return response(400, {"error": "qty debe ser entero y price numérico"})

    # if_not_exists permite crear la fila la primera vez e incrementar después
    table.update_item(
        Key={"pk": f"USER#{user_id}", "sk": f"CART#{product_id}"},
        UpdateExpression="SET qty = if_not_exists(qty, :zero) + :inc, price = :price",
        ExpressionAttributeValues={
            ":inc": qty_dec,
            ":zero": 0,
            ":price": price_dec,
        },
    )

    _invalidate(user_id)
    return response(200, {"message": "Producto agregado al carrito", "productId": product_id})


def _handle_delete(table, user_id, event):
    query_params = event.get("queryStringParameters") or {}
    product_id = query_params.get("productId")
    # Soporta también product_id como path parameter si el API lo enruta así
    if not product_id:
        product_id = (event.get("pathParameters") or {}).get("product_id")
    if not product_id:
        return response(400, {"error": "Falta el parámetro productId"})

    table.delete_item(Key={"pk": f"USER#{user_id}", "sk": f"CART#{product_id}"})

    _invalidate(user_id)
    return no_content()


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        path_params = event.get("pathParameters") or {}
        user_id = path_params.get("user_id")

        if not user_id:
            return response(400, {"error": "Falta el parámetro user_id"})

        table = get_table()

        if http_method == "GET":
            return _handle_get(table, user_id)
        elif http_method == "POST":
            return _handle_post(table, user_id, event)
        elif http_method == "DELETE":
            return _handle_delete(table, user_id, event)
        else:
            return response(405, {"error": "Método no permitido"})

    except Exception as e:
        logging.exception("Error en manage_cart")
        return response(500, {"error": f"Internal server error: {str(e)}"})