import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from boto3.dynamodb.conditions import Key

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))

def lambda_handler(event, context):
    query_params = event.get('queryStringParameters') or {}
    category = query_params.get('category') if query_params else None
    
    table = get_table()
    cache_key = f'products:cat:{category}' if category else 'products:all'

    def _fetch():
        response = table.query(
            KeyConditionExpression=Key('pk').eq('CATALOG#main') & Key('sk').begins_with('PRODUCT#')
        )
        items = response.get('Items', [])
        
        while 'LastEvaluatedKey' in response:
            response = table.query(
                KeyConditionExpression=Key('pk').eq('CATALOG#main') & Key('sk').begins_with('PRODUCT#'),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))
            
        if category:
            # Filter by category in memory
            items = [item for item in items if item.get('category') == category]
            
        return items

    result = cache_aside(cache_key, _fetch, TTL)

    # cache_aside retorna {source, data}, extraer solo los datos
    data = result.get('data', []) if isinstance(result, dict) else result

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        },
        "body": json.dumps(data, default=str)
    }
