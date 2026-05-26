import json, os, logging
from decimal import Decimal

from shared.dynamo_client import get_table
from shared.cache_client import get_redis, cache_aside
from boto3.dynamodb.conditions import Key

# TTL for generic caches (orders) and cart cache
CACHE_TTL = int(os.getenv('CACHE_TTL_SECONDS', '60'))
CART_TTL = int(os.getenv('CART_TTL_SECONDS', '300'))

def _fetch_orders(table, user_id):
    response = table.query(
        KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') &
                           Key('sk').begins_with('ORDER#')
    )
    return response.get('Items', [])

def _fetch_cart(table, user_id):
    # Try cache first via cache_aside (Redis)
    cache_key = f'cart:{user_id}'
    r = get_redis()
    try:
        cached = r.hgetall(cache_key)
        if cached:
            # convert each json string to dict
            return [json.loads(v) for v in cached.values()]
    except Exception as e:
        logging.warning("Redis read error for %s: %s", cache_key, e)
    # fallback to DynamoDB
    response = table.get_item(Key={'pk': f'USER#{user_id}', 'sk': 'CART'})
    items = response.get('Item', {}).get('items', {})
    # Prime cache
    if items:
        try:
            for pid, val in items.items():
                r.hset(cache_key, pid, json.dumps(val))
            r.expire(cache_key, CART_TTL)
        except Exception as e:
            logging.warning("Redis write error for %s: %s", cache_key, e)
    return list(items.values())

def lambda_handler(event, context):
    path = event.get('resource') or event.get('path') or ''
    http_method = event.get('httpMethod')
    user_id = event.get('pathParameters', {}).get('user_id')
    if not user_id:
        return {"statusCode": 400, "body": json.dumps({"error": "user_id requerido"})}

    table = get_table()

    # CART endpoints
    if '/cart' in path:
        if http_method == 'GET':
            items = _fetch_cart(table, user_id)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(items, default=str)
            }
        elif http_method == 'POST':
            # body expected: {"productId":..., "qty":..., "price":...}
            try:
                body = json.loads(event.get('body') or '{}')
            except json.JSONDecodeError as e:
                logging.error("JSON decode error: %s", e)
                return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON body"})}
            product_id = body.get('productId')
            qty = body.get('qty')
            price = body.get('price')
            if not product_id or qty is None or price is None:
                return {"statusCode": 400, "body": json.dumps({"error": "productId, qty and price required"})}
            subtotal = qty * price
            item = {"productId": product_id, "qty": qty, "price": price, "subtotal": subtotal}
            # DynamoDB requires Decimal instead of float
            dynamo_item = {
                "productId": product_id,
                "qty": Decimal(str(qty)),
                "price": Decimal(str(price)),
                "subtotal": Decimal(str(subtotal)),
            }
            cache_key = f'cart:{user_id}'
            r = get_redis()
            try:
                r.hset(cache_key, product_id, json.dumps(item))
                r.expire(cache_key, CART_TTL)
            except Exception as e:
                logging.warning("Redis write error for %s: %s", cache_key, e)
            try:
                table.update_item(
                    Key={'pk': f'USER#{user_id}', 'sk': 'CART'},
                    UpdateExpression="SET items.#pid = :val",
                    ExpressionAttributeNames={'#pid': product_id},
                    ExpressionAttributeValues={':val': dynamo_item}
                )
            except Exception as e:
                logging.error("DynamoDB update error for user %s: %s", user_id, e)
                return {"statusCode": 500, "body": json.dumps({"error": "Internal server error (DynamoDB)"})}
            return {"statusCode": 200, "body": json.dumps(item)}
        elif http_method == 'DELETE':
            # Determine product ID for DELETE
            product_id = event.get('pathParameters', {}).get('product_id')
            if not product_id:
                # fallback to query string (e.g., /cart/ana?productId=phone-x100)
                product_id = (event.get('queryStringParameters') or {}).get('productId')
            if not product_id:
                return {"statusCode": 400, "body": json.dumps({"error": "product_id requerido"})}
            # Remove from Redis
            cache_key = f'cart:{user_id}'
            r = get_redis()
            try:
                r.hdel(cache_key, product_id)
            except Exception as e:
                logging.warning("Redis delete error for %s: %s", cache_key, e)
            # Remove from DynamoDB
            table.update_item(
                Key={'pk': f'USER#{user_id}', 'sk': 'CART'},
                UpdateExpression="REMOVE items.#pid",
                ExpressionAttributeNames={'#pid': product_id}
            )
            return {"statusCode": 204}
        else:
            return {"statusCode": 405, "body": json.dumps({"error": "Método no permitido para /cart"})}

    # ORDERS endpoint (existing behavior)
    cache_key = f'user:orders:{user_id}'
    items = cache_aside(cache_key, lambda: _fetch_orders(table, user_id), CACHE_TTL)
    return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(items, default=str)}