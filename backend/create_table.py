import boto3
import time

# Conexión usando el endpoint de Docker
dynamodb = boto3.client('dynamodb', endpoint_url='http://dynamodb:8000', region_name='us-east-1')

def create_ecommerce_infrastructure():
    try:
        # Borrar para asegurar que siempre iniciamos con el diseño limpio
        dynamodb.delete_table(TableName='Ecommerce')
        print("Eliminando versión previa de la tabla...")
        time.sleep(2)
    except:
        pass

    print("Levantando tablas según el diseño de arquitectura...")
    
    dynamodb.create_table(
        TableName='Ecommerce',
        # Definición de atributos base para las llaves
        AttributeDefinitions=[
            {'AttributeName': 'pk', 'AttributeType': 'S'},
            {'AttributeName': 'sk', 'AttributeType': 'S'},
            {'AttributeName': 'gsi1pk', 'AttributeType': 'S'},
            {'AttributeName': 'gsi1sk', 'AttributeType': 'S'},
        ],
        # Esquema de la tabla principal (Patrones 1, 2, 3 y 5)
        KeySchema=[
            {'AttributeName': 'pk', 'KeyType': 'HASH'},
            {'AttributeName': 'sk', 'KeyType': 'RANGE'}
        ],
        # Definición del GSI1 (Requerido por el Patrón 4: GlobalOrderSearch)
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
    
    # Esperar a que esté lista antes de que Django intente conectar
    waiter = dynamodb.get_waiter('table_exists')
    waiter.wait(TableName='Ecommerce')
    print("✅ Infraestructura desplegada exitosamente.")

if __name__ == "__main__":
    create_ecommerce_infrastructure()