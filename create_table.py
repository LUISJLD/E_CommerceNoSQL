import boto3

dynamodb = boto3.client('dynamodb', endpoint_url='http://dynamodb:8000', region_name='us-east-1')

# 1. Borrar si existe para limpiar el esquema viejo
try:
    dynamodb.delete_table(TableName='Ecommerce')
except:
    pass

# 2. Crear con el esquema de tus archivos (PK, SK y GSI1)
dynamodb.create_table(
    TableName='Ecommerce',
    KeySchema=[
        {'AttributeName': 'pk', 'KeyType': 'HASH'},
        {'AttributeName': 'sk', 'KeyType': 'RANGE'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'pk', 'AttributeType': 'S'},
        {'AttributeName': 'sk', 'AttributeType': 'S'},
        {'AttributeName': 'gsi1pk', 'AttributeType': 'S'},
        {'AttributeName': 'gsi1sk', 'AttributeType': 'S'}
    ],
    GlobalSecondaryIndexes=[{
        'IndexName': 'GSI1',
        'KeySchema': [
            {'AttributeName': 'gsi1pk', 'KeyType': 'HASH'},
            {'AttributeName': 'gsi1sk', 'KeyType': 'RANGE'}
        ],
        'Projection': {'ProjectionType': 'ALL'},
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    }],
    ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
)
print("Infraestructura NoSQL sincronizada con el código de Django.")