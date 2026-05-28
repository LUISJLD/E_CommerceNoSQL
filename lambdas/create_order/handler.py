import json
import logging
import uuid
from decimal import Decimal
from datetime import datetime

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside, get_redis
from shared.responses import response
from boto3.dynamodb.conditions import Key

logging.getLogger().setLevel(logging.INFO)

def _invalidate(user_id: str):
    try:
        get_redis().delete(f"cart:{user_id}")
    except Exception as e:
        logging.warning("No se pudo invalidar cache de cart:%s: %s", user_id, e)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("userId")

        if not user_id:
            return response(400, {"error": "Se requiere userId"})

        table = get_table()
        cache_key = f"cart:{user_id}"

        # Obtener carrito de la caché (o base de datos si falló caché)
        def _fetch_cart():
            resp = table.query(
                KeyConditionExpression=Key("pk").eq(f"USER#{user_id}") & Key("sk").begins_with("CART#")
            )
            return [
                {
                    "productId": it["sk"].replace("CART#", ""),
                    "qty": int(it.get("qty", 0)),
                    "price": float(it.get("price", 0)),
                }
                for it in resp.get("Items", [])
            ]

        cart_data = cache_aside(cache_key, _fetch_cart, 300)
        items = cart_data.get("data", []) if isinstance(cart_data, dict) else cart_data

        if not items:
            return response(400, {"error": "El carrito está vacío"})

        order_id = str(uuid.uuid4())[:8]
        total = sum(Decimal(str(item["price"])) * item["qty"] for item in items)
        now = datetime.utcnow().isoformat() + "Z"

        # Escribir la orden en DynamoDB y borrar el carrito
        with table.batch_writer() as batch:
            # Metadata de la orden
            batch.put_item(Item={
                'pk': f'USER#{user_id}',
                'sk': f'ORDER#{order_id}',
                'gsi1pk': f'ORDER#{order_id}',
                'gsi1sk': 'METADATA',
                'orderId': order_id,
                'total': total,
                'status': 'Pendiente',
                'createdAt': now,
            })

            # Items de la orden
            for item in items:
                batch.put_item(Item={
                    'pk': f'ORDER#{order_id}',
                    'sk': f'ITEM#{item["productId"]}',
                    'productId': item["productId"],
                    'qty': item["qty"],
                    'price': Decimal(str(item["price"])),
                    'subtotal': Decimal(str(item["price"])) * item["qty"]
                })

            # Eliminar items del carrito de DynamoDB
            for item in items:
                batch.delete_item(Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'CART#{item["productId"]}'
                })

        # Descontar stock de cada producto
        for item in items:
            try:
                table.update_item(
                    Key={'pk': 'CATALOG#main', 'sk': f'PRODUCT#{item["productId"]}'},
                    UpdateExpression='SET stock = stock - :qty',
                    ConditionExpression='stock >= :qty',
                    ExpressionAttributeValues={':qty': item["qty"]},
                )
            except table.meta.client.exceptions.ConditionalCheckFailedException:
                logging.warning("Stock insuficiente para %s, se procesó igual", item["productId"])

        # Limpiar caché de Redis (carrito + productos)
        _invalidate(user_id)
        try:
            get_redis().delete("products:all")
        except Exception:
            pass

        return response(201, {"message": "Orden creada con éxito", "orderId": order_id, "total": float(total)})

    except Exception as e:
        logging.exception("Error en create_order")
        return response(500, {"error": f"Internal server error: {str(e)}"})
