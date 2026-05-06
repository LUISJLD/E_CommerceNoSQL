import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.dynamo_client import get_table
from shared.cache_client import cache_aside
from boto3.dynamodb.conditions import Attr

TTL = int(os.environ.get('CACHE_TTL_SECONDS', '60'))

def lambda_handler(event, context):
    table = get_table()

    def _fetch():
        items, response = [], table.scan(
            FilterExpression=Attr('sk').eq('PROFILE')
        )
        items.extend(response.get('Items', []))
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression=Attr('sk').eq('PROFILE'),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))
        return items

    items = cache_aside('users:all_profiles', _fetch, TTL)

    users = [{
        'userId': item.get('pk', '').replace('USER#', ''),
        **item
    } for item in items]

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(users, default=str)
    }