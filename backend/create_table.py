import boto3
import time

# LocalStack usa el puerto 4566 por defecto para todos los servicios
dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:4566')

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