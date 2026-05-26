import os
import json
import boto3
from redis_client import cache_aside, get_redis # Ajusta esta ruta si tu helper se llama diferente

# Configuración dinámica de endpoints para LocalStack / Docker
endpoint_url = os.environ.get("AWS_ENDPOINT_URL") or "http://localhost:4566"
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
                    KeyConditionExpression="pk = :pk AND begins_with(sk, :sk)",
                    ExpressionAttributeValues={
                        ":pk": f"USER#{user_id}",
                        ":sk": "CART#"
                    }
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
            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps(cart_data)
            }

        # ----------------- FLUJO POST (AGREGAR/ACTUALIZAR PRODUCTO) -----------------
        elif http_method == "POST":
            body = json.loads(event.get("body", "{}") or "{}")
            product_id = body.get("productId")
            qty = body.get("qty")
            price = body.get("price")

            if not all([product_id, qty, price]):
                return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON body structure"})}

            # Guardar/Actualizar en DynamoDB (Single Table Design PK: USER#id, SK: CART#prod_id)
            table.put_item(Item={
                "pk": f"USER#{user_id}",
                "sk": f"CART#{product_id}",
                "qty": qty,
                "price": price
            })

            # Invalidación/Actualización de la caché en Redis
            # Guardamos el producto individual en el Hash o simplemente limpiamos la key para forzar recarga
            try:
                redis_client.delete(redis_key) # Invalidación clásica: borramos para el siguiente GET
            except Exception as ex:
                pass 

            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*"},
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
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Product removed from cart successfully"})}

        else:
            return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal server error (DynamoDB): {str(e)}"})
        }