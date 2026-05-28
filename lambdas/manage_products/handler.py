import json
import logging
import os
import uuid
import boto3
from decimal import Decimal

from shared.dynamo_client import get_table
from shared.responses import response, no_content
from shared.auth_utils import require_admin

logging.getLogger().setLevel(logging.INFO)

IMAGES_BUCKET = os.environ.get("IMAGES_BUCKET_NAME")

s3_client = boto3.client(
    's3',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT_URL'),
    aws_access_key_id='local',
    aws_secret_access_key='local',
    region_name='us-east-1'
)

def _generate_upload_url(file_name, file_type):
    """Genera una URL firmada para subir una imagen de producto."""
    if not IMAGES_BUCKET:
        return None

    key = f"products/{uuid.uuid4()}-{file_name}"

    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': IMAGES_BUCKET,
            'Key': key,
            'ContentType': file_type,
            'ACL': 'public-read'
        },
        ExpiresIn=3600
    )

    presigned_url = presigned_url.replace("localstack:4566", "localhost:4566")
    public_url = f"http://localhost:4566/{IMAGES_BUCKET}/{key}"

    return presigned_url, public_url


def _handle_post(table, body):
    if body.get("action") == "get_upload_url":
        file_name = body.get("fileName", "image.jpg")
        file_type = body.get("fileType", "image/jpeg")
        upload_url, public_url = _generate_upload_url(file_name, file_type)
        return response(200, {
            "uploadUrl": upload_url,
            "publicUrl": public_url
        })

    prod_id = body.get("id") or str(uuid.uuid4())[:8]

    item = {
        'pk': 'CATALOG#main',
        'sk': f'PRODUCT#{prod_id}',
        'productId': prod_id,
        'name': body.get('name', 'Sin nombre'),
        'price': Decimal(str(body.get('price', 0))),
        'stock': body.get('stock', 0),
        'image': body.get('image', 'https://placehold.co/200x200/e8f5e9/333?text=New+Product'),
        'category': body.get('category', 'General'),
    }

    table.put_item(Item=item)
    return response(201, {"message": "Producto creado", "product": {**item, "price": float(item["price"])}})

def _handle_put(table, prod_id, body):
    update_expr = []
    expr_attrs = {}

    if "name" in body:
        update_expr.append("#name = :name")
        expr_attrs[":name"] = body["name"]
    if "price" in body:
        update_expr.append("price = :price")
        expr_attrs[":price"] = Decimal(str(body["price"]))
    if "stock" in body:
        update_expr.append("stock = :stock")
        expr_attrs[":stock"] = body["stock"]
    if "image" in body:
        update_expr.append("image = :img")
        expr_attrs[":img"] = body["image"]
    if "category" in body:
        update_expr.append("category = :cat")
        expr_attrs[":cat"] = body["category"]

    if not update_expr:
        return response(400, {"error": "Nada que actualizar"})

    expr = "SET " + ", ".join(update_expr)
    expr_names = {"#name": "name"} if "name" in body else None

    try:
        kwargs = {
            "Key": {'pk': 'CATALOG#main', 'sk': f'PRODUCT#{prod_id}'},
            "UpdateExpression": expr,
            "ExpressionAttributeValues": expr_attrs,
            "ReturnValues": "ALL_NEW"
        }
        if expr_names:
            kwargs["ExpressionAttributeNames"] = expr_names

        res = table.update_item(**kwargs)

        updated = res.get("Attributes", {})
        if "price" in updated:
            updated["price"] = float(updated["price"])

        return response(200, {"message": "Producto actualizado", "product": updated})
    except Exception as e:
        return response(500, {"error": str(e)})

def _handle_delete(table, prod_id):
    table.delete_item(Key={'pk': 'CATALOG#main', 'sk': f'PRODUCT#{prod_id}'})
    return no_content()


@require_admin
def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")
        body = json.loads(event.get("body") or "{}")
        path_params = event.get("pathParameters") or {}
        prod_id = path_params.get("id")

        table = get_table()

        if http_method == "POST":
            return _handle_post(table, body)
        elif http_method == "PUT" and prod_id:
            return _handle_put(table, prod_id, body)
        elif http_method == "DELETE" and prod_id:
            return _handle_delete(table, prod_id)

        return response(405, {"error": "Método no permitido o falta ID"})

    except Exception as e:
        logging.exception("Error en manage_products")
        return response(500, {"error": f"Internal server error: {str(e)}"})
