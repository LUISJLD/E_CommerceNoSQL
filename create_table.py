import time
import boto3

time.sleep(5)

dynamodb = boto3.client(
    'dynamodb',
    endpoint_url='http://dynamodb:8000',
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local'
)

tables = dynamodb.list_tables()['TableNames']

if 'Ecommerce' not in tables:
    dynamodb.create_table(
        TableName='Ecommerce',
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )

print("Tabla Ecommerce lista")