import os
import json
import boto3
from boto3.dynamodb.conditions import Key
from shared.cache_client import cache_aside, get_redis

# Configuración dinámica de endpoints para LocalStack / Docker
endpoint_url = os.environ.get(
    "DYNAMODB_ENDPOINT_URL",
    "http://localhost:4566"
)
if os.environ.get("LOCALSTACK_HOSTNAME"):
    endpoint_url = f"http://{os.environ.get('LOCALSTACK_HOSTNAME')}:4566"

dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
table = dynamodb.Table(os.environ.get("TABLE_NAME", "Ecommerce"))
redis_client = get_redis()

def lambda_handler(event, context):
    http_method = event.get("httpMethod", "")
    path_parameters = event.get("pathParameters", {}) or {}
    user_id = path_parameters.get("user_id")

    if not user_id:
        return {"statusCode": 400, "body": json.dumps({"error": "Missing user_id parameter"})}

    # Definimos la llave única para el Hash de Redis
    redis_key = f"cart:{user_id}"

    try:
        # ----------------- FLUJO GET (LECTURA CON CACHE-ASIDE) -----------------
        if http_method == "GET":
            def fetch_from_dynamodb():
                response = table.query(
                    KeyConditionExpression=Key("pk").eq(f"USER#{user_id}") &
                    Key("sk").begins_with("CART#")
                )
                items = response.get("Items", [])
                # Limpiamos los prefijos de base de datos antes de responder
                return [
                    {
                        "productId": item["sk"].replace("CART#", ""),
                        "qty": int(item["qty"]),
                        "price": float(item["price"])
                    } for item in items
                ]
            
            # Usamos el helper de tu archivo anterior (TTL por defecto desde env o 300s)
            ttl = int(os.environ.get("CART_TTL_SECONDS", 300))
            cart_data = cache_aside(redis_key, fetch_from_dynamodb, ttl=ttl)
            
            # cache_aside retorna {source, data}, extraer solo los datos
            data = cart_data.get('data', []) if isinstance(cart_data, dict) else cart_data
            
            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": json.dumps(data)
            }

        # ----------------- FLUJO POST (AGREGAR/ACTUALIZAR PRODUCTO) -----------------
        elif http_method == "POST":
            body = json.loads(event.get("body", "{}") or "{}")
            product_id = body.get("productId")
            qty = body.get("qty")
            price = body.get("price")

            if not all([product_id, qty is not None, price is not None]):
                return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON body structure"})}

            # Incrementar qty si el producto ya existe, o insertar con qty inicial
            table.update_item(
                Key={
                    "pk": f"USER#{user_id}",
                    "sk": f"CART#{product_id}",
                },
                UpdateExpression="SET qty = if_not_exists(qty, :zero) + :inc, price = :price",
                ExpressionAttributeValues={
                    ":inc":   int(qty),
                    ":zero":  0,
                    ":price": price,
                },
            )

            # Invalidar caché para que el próximo GET lea DynamoDB
            try:
                redis_client.delete(redis_key)
            except Exception:
                pass

            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": json.dumps({"message": "Product added to cart successfully"})
            }

        # ----------------- FLUJO DELETE (ELIMINAR PRODUCTO) -----------------
        elif http_method == "DELETE":
            query_params = event.get("queryStringParameters", {}) or {}
            product_id = query_params.get("productId")

            if not product_id:
                return {"statusCode": 400, "body": json.dumps({"error": "Missing productId query parameter"})}

            # Eliminar de DynamoDB
            table.delete_item(Key={
                "pk": f"USER#{user_id}",
                "sk": f"CART#{product_id}"
            })

            # Invalidación de la caché en Redis
            try:
                redis_client.delete(redis_key)
            except Exception as ex:
                pass

            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": json.dumps({"message": "Product removed from cart successfully"})}

        else:
            return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal server error (DynamoDB): {str(e)}"})
        }