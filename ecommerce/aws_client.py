import boto3
from django.conf import settings

class DynamoDBClient:
    def __init__(self):
        self.resource = boto3.resource(
            'dynamodb',
            endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
            region_name=settings.AWS_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.table = self.resource.Table('Ecommerce')

# Instancia global para importar en servicios
dynamo_instance = DynamoDBClient()