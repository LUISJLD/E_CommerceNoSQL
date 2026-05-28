import boto3
from decimal import Decimal
import os
import hashlib

# Usa variable de entorno o default a LocalStack
endpoint = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://localhost:4566')

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=endpoint,
    region_name='us-east-1',
    aws_access_key_id='local',
    aws_secret_access_key='local',
)

# Nombre de tabla desde env o default
table_name = os.getenv('TABLE_NAME', 'Ecommerce')
table = dynamodb.Table(table_name)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def seed_products():
    products = [
        {
            'id': 'phone-x100',
            'name': 'Teléfono Inteligente X100',
            'price': 850000,
            'stock': 15,
            'image': 'https://placehold.co/200x200/e8f5e9/333?text=Phone',
            'category': 'Electrónica',
        },
        {
            'id': 'laptop-wp15',
            'name': 'Portátil WorkPro 15',
            'price': 2200000,
            'stock': 8,
            'image': 'https://placehold.co/200x200/e3f2fd/333?text=Laptop',
            'category': 'Electrónica',
        },
        {
            'id': 'headphones-z5',
            'name': 'Auriculares Bluetooth Z5',
            'price': 120000,
            'stock': 25,
            'image': 'https://placehold.co/200x200/f3e5f5/333?text=Headphones',
            'category': 'Electrónica',
        },
        {
            'id': 'watch-fittrack',
            'name': 'Reloj Inteligente FitTrack',
            'price': 350000,
            'stock': 3,
            'image': 'https://placehold.co/200x200/fff3e0/333?text=Watch',
            'category': 'Electrónica',
        },
        {
            'id': 'backpack-travel',
            'name': 'Mochila de Viaje',
            'price': 90000,
            'stock': 50,
            'image': 'https://placehold.co/200x200/efebe9/333?text=Backpack',
            'category': 'Deportes',
        },
        {
            'id': 'tshirt-cotton',
            'name': 'Camiseta Algodón Hombre',
            'price': 45000,
            'stock': 100,
            'image': 'https://placehold.co/200x200/fce4ec/333?text=T-Shirt',
            'category': 'Ropa',
        },
    ]

    for prod in products:
        table.put_item(Item={
            'pk': f'CATALOG#main',
            'sk': f'PRODUCT#{prod["id"]}',
            'productId': prod['id'],
            'name': prod['name'],
            'price': Decimal(str(prod['price'])),
            'stock': prod['stock'],
            'image': prod['image'],
            'category': prod['category'],
        })

    print(f"   ✅ {len(products)} productos insertados")


def seed_users_and_orders():
    users = [
        {'id': 'admin@ecommerce.com', 'name': 'Administrador', 'email': 'admin@ecommerce.com', 'address': 'Sede Principal', 'role': 'admin', 'password': 'admin123'},
        {'id': 'jgarcia@gmail.com', 'name': 'Juan Garcia', 'email': 'jgarcia@gmail.com', 'address': 'Calle 100 # 12 - 34, Apto 501, Bogotá, Colombia', 'role': 'user', 'password': 'user123'},
        {'id': 'ana.mtz@outlook.com', 'name': 'Ana Martinez', 'email': 'ana.mtz@outlook.com', 'address': 'Calle 10 #22-45, Santa Marta', 'role': 'user', 'password': 'user123'},
        {'id': 'daniel@unimag.edu.co', 'name': 'Daniel Eduardo', 'email': 'daniel@unimag.edu.co', 'address': 'Carrera 5 #18-30, Santa Marta', 'role': 'user', 'password': 'user123'},
    ]

    for i, user in enumerate(users):
        u_id = user['id']
        o_id = f"10{i+1}"

        table.put_item(Item={
            'pk': f'USER#{u_id}',
            'sk': 'PROFILE',
            'name': user['name'],
            'email': user['email'],
            'address': user['address'],
            'role': user['role'],
            'passwordHash': hash_password(user['password']),
            'payments': ['Visa', 'Efectivo'],
        })

        if user['role'] != 'admin':
            table.put_item(Item={
                'pk': f'USER#{u_id}',
                'sk': f'ORDER#{o_id}',
                'gsi1pk': f'ORDER#{o_id}',
                'gsi1sk': 'METADATA',
                'orderId': o_id,
                'total': Decimal('850000'),
                'date': '2026-04-20',
                'status': 'Entregado',
                'address': user['address'],
            })

            table.put_item(Item={
                'pk': f'ORDER#{o_id}',
                'sk': f'ITEM#PROD_{i}',
                'product': 'Teléfono Inteligente X100',
                'qty': 1,
                'unitPrice': Decimal('850000'),
                'subtotal': Decimal('850000'),
            })

    print(f"   ✅ {len(users)} usuarios y órdenes insertados")


if __name__ == "__main__":
    print("🌱 Seeding datos en LocalStack...")
    try:
        seed_products()
        seed_users_and_orders()
        print("✅ Seed completo exitosamente.")
    except Exception as e:
        print(f"❌ Error al insertar los datos: {e}")