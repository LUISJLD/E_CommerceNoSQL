import boto3
import os
import time

endpoint = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://dynamodb:8000')

dynamodb = boto3.client(
    'dynamodb',
    endpoint_url=endpoint,
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local',
)


def create_ecommerce_infrastructure():
    try:
        dynamodb.delete_table(TableName='Ecommerce')
        print("Eliminando versión previa de la tabla...")
        time.sleep(2)
    except Exception:
        pass

    print("Levantando tabla Ecommerce (Single Table Design)...")

    dynamodb.create_table(
        TableName='Ecommerce',
        AttributeDefinitions=[
            {'AttributeName': 'pk', 'AttributeType': 'S'},
            {'AttributeName': 'sk', 'AttributeType': 'S'},
            {'AttributeName': 'gsi1pk', 'AttributeType': 'S'},
            {'AttributeName': 'gsi1sk', 'AttributeType': 'S'},
        ],
        KeySchema=[
            {'AttributeName': 'pk', 'KeyType': 'HASH'},
            {'AttributeName': 'sk', 'KeyType': 'RANGE'}
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

    waiter = dynamodb.get_waiter('table_exists')
    waiter.wait(TableName='Ecommerce')
    print("✅ Tabla Ecommerce creada exitosamente.")


if __name__ == "__main__":
    create_ecommerce_infrastructure()
