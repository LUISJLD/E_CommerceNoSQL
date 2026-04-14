from .aws_client import dynamo_instance
from boto3.dynamodb.conditions import Key

class EcommerceService:
    table = dynamo_instance.table

    @staticmethod
    def get_user_profile(user_id):
        # Patrón 1: Perfil de usuario (GetItem)
        response = EcommerceService.table.get_item(
            Key={'pk': f'USER#{user_id}', 'sk': 'PROFILE'}
        )
        return response.get('Item')

    @staticmethod
    def get_user_orders(user_id):
        # Patrón 2: Órdenes de un usuario (Query PK)
        response = EcommerceService.table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & 
                                   Key('sk').begins_with('ORDER#')
        )
        return response.get('Items', [])

    @staticmethod
    def get_order_items(order_id):
        # Patrón 3: Ítems de una orden
        response = EcommerceService.table.query(
            KeyConditionExpression=Key('pk').eq(f'ORDER#{order_id}') & 
                                   Key('sk').begins_with('ITEM#')
        )
        return response.get('Items', [])

    @staticmethod
    def get_order_by_id(order_id):
        # Patrón 4: Buscar orden sin usuario (Uso del GSI1)
        response = EcommerceService.table.query(
            IndexName='GSI1',
            KeyConditionExpression=Key('gsi1pk').eq(f'ORDER#{order_id}') & 
                                   Key('gsi1sk').eq('METADATA')
        )
        return response.get('Items', [None])[0]

    @staticmethod
    def get_products_by_category(prod_id, category):
        # Patrón 5: Productos por categoría
        response = EcommerceService.table.query(
            KeyConditionExpression=Key('pk').eq(f'PROD#{prod_id}') & 
                                   Key('sk').eq(f'CAT#{category}')
        )
        return response.get('Items', [])