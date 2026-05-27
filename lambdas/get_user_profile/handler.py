import json, sys, os
 sys.path.insert(0, os.path.dirname(__file__))

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))

def lambda_handler(event, context):
    user_id = event.get('pathParameters', {}).get('user_id')
    if not user_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "user_id requerido"})
        }

    table = get_table()
    cache_key = f'user:profile:{user_id}'

    def _fetch():
        response = table.get_item(
            Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'}
        )
        return response.get('Item')

    item = cache_aside(cache_key, _fetch, TTL)

    # cache_aside retorna {source, data}, extraer solo los datos
    data = item.get('data') if isinstance(item, dict) else item

    if not data:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Perfil no encontrado"})
        }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(data, default=str)
    }