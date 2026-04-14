import boto3

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://dynamodb:8000',
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local'
)

table = dynamodb.Table('Ecommerce')

# Insertamos el usuario con el formato de Single Table Design
table.put_item(
   Item={
        'pk': 'USER#1',      # Esto es lo que busca tu ruta /api/user/1/profile/
        'sk': 'PROFILE',     # Esto es obligatorio según tu esquema
        'name': 'Daniel Eduardo',
        'email': 'daniel@correo.com',
        'role': 'admin'
    }
)

print("Usuario de prueba insertado con éxito con el nuevo esquema")