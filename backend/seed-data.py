import boto3
from decimal import Decimal
import os

endpoint = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://dynamodb:8000')
dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:4566')
table = dynamodb.Table('Ecommerce')

def seed_complete_data():
    users = [
        {'id': 'ana', 'name': 'Ana Martinez', 'email': 'ana.mtz@outlook.com', 'prod': 'Escritorio Elevable', 'price': 450000},
        {'id': 'daniel', 'name': 'Daniel Eduardo', 'email': 'daniel@unimag.edu.co', 'prod': 'Monitor 4K', 'price': 1200000},
    ]

    for i, user in enumerate(users):
        u_id = user['id']
        o_id = f"10{i+1}"
        price = Decimal(str(user['price']))
        
        # 1. PERFIL (Añadí address y payments que pide tu UI)
        table.put_item(Item={
            'pk': f'USER#{u_id}',
            'sk': 'PROFILE',
            'name': user['name'],
            'email': user['email'],
            'address': 'Calle 10 #22-45, Santa Marta',
            'payments': ['Visa', 'Efectivo']
        })

        # 2. CABECERA DEL PEDIDO (Nombres ajustados a tu React)
        table.put_item(Item={
            'pk': f'USER#{u_id}',
            'sk': f'ORDER#{o_id}',
            'gsi1pk': f'ORDER#{o_id}',
            'gsi1sk': 'METADATA',
            'orderId': o_id,         # Antes era order_id
            'total': price,          # Antes era total_amount
            'date': '2026-04-20',    # Antes era order_date
            'status': 'Entregado',
            'address': 'Sede Unimagdalena'
        })

        # 3. ÍTEMS DEL PEDIDO (Patrón 3: pk=ORDER#, sk begins_with ITEM#)
        table.put_item(Item={
            'pk': f'ORDER#{o_id}',
            'sk': f'ITEM#PROD_{i}', 
            'product': user['prod'], # Antes era product_name
            'qty': 1,                # Antes era quantity
            'unitPrice': price,      # Antes era price
            'subtotal': price        # Campo nuevo que pide tu tabla
        })

    print("✅ Datos sincronizados con el Frontend de React.")

if __name__ == "__main__":
    seed_complete_data()