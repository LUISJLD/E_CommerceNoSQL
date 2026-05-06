import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from boto3.dynamodb.conditions import Key

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))

def lambda_handler(event, context):
    user_id = event.get('pathParameters', {}).get('user_id')
    if not user_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "user_id requerido"})
        }

    table = get_table()
    cache_key = f'user:orders:{user_id}'

    def _fetch():
        response = table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') &
                                   Key('sk').begins_with('ORDER#')
        )
        return response.get('Items', [])

    items = cache_aside(cache_key, _fetch, TTL)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(items, default=str)
    }