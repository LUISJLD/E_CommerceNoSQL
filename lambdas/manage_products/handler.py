import json
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.dynamo_client import get_table
from shared.cache_client import get_redis
from decimal import Decimal

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))


def _invalidate_product_cache(category=None):
    try:
        r = get_redis()
        r.delete('products:all')
        r.delete('products:cat:None')
        if category:
            r.delete(f'products:cat:{category}')
    except Exception:
        pass


def lambda_handler(event, context):
    http_method = event.get('httpMethod', '')
    path_params = event.get('pathParameters') or {}

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
    }

    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    table = get_table()

    # POST /products — crear producto
    if http_method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return {'statusCode': 400, 'headers': headers,
                    'body': json.dumps({'error': 'Invalid JSON body'})}

        name = body.get('name', '').strip()
        price = body.get('price')
        stock = body.get('stock')
        category = body.get('category', '').strip()
        image = body.get('image', '').strip()

        if not name or price is None or stock is None or not category:
            return {'statusCode': 400, 'headers': headers,
                    'body': json.dumps({'error': 'name, price, stock and category are required'})}

        product_id = body.get('productId') or str(uuid.uuid4())[:8]

        table.put_item(Item={
            'pk': 'CATALOG#main',
            'sk': f'PRODUCT#{product_id}',
            'productId': product_id,
            'name': name,
            'price': Decimal(str(price)),
            'stock': int(stock),
            'category': category,
            'image': image,
        })

        _invalidate_product_cache(category)

        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({'message': 'Product created', 'productId': product_id}),
        }

    # DELETE /products/{product_id} — eliminar producto
    elif http_method == 'DELETE':
        product_id = path_params.get('product_id')
        if not product_id:
            return {'statusCode': 400, 'headers': headers,
                    'body': json.dumps({'error': 'Missing product_id'})}

        # Leer primero para invalidar la caché de categoría correcta
        existing = table.get_item(
            Key={'pk': 'CATALOG#main', 'sk': f'PRODUCT#{product_id}'}
        ).get('Item')
        category = existing.get('category') if existing else None

        table.delete_item(Key={'pk': 'CATALOG#main', 'sk': f'PRODUCT#{product_id}'})
        _invalidate_product_cache(category)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Product deleted', 'productId': product_id}),
        }

    return {'statusCode': 405, 'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})}
