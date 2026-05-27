import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from boto3.dynamodb.conditions import Key

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))

def lambda_handler(event, context):
    order_id = event.get('pathParameters', {}).get('order_id')
    if not order_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "order_id requerido"})
        }

    table = get_table()
    cache_key = f'order:items:{order_id}'

    def _fetch():
        response = table.query(
            KeyConditionExpression=Key('pk').eq(f'ORDER#{order_id}') &
                                   Key('sk').begins_with('ITEM#')
        )
        return response.get('Items', [])

    items = cache_aside(cache_key, _fetch, TTL)

    # cache_aside retorna {source, data}, extraer solo los datos
    data = items.get('data', []) if isinstance(items, dict) else items

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(data, default=str)
    }