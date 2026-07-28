"""
seed_mongo.py
─────────────
Pobla MongoDB Atlas con los mismos productos, usuarios y órdenes
que estaban en DynamoDB/LocalStack.

Uso:
    cd backend
    python seed_mongo.py
"""
import asyncio
import hashlib
import os
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


PRODUCTS = [
    {
        "productId": "phone-x100",
        "name": "Teléfono Inteligente X100",
        "price": 850000,
        "stock": 15,
        "image": "https://placehold.co/200x200/e8f5e9/333?text=Teléfono",
        "category": "Electrónica",
    },
    {
        "productId": "laptop-wp15",
        "name": "Portátil WorkPro 15",
        "price": 2200000,
        "stock": 8,
        "image": "https://placehold.co/200x200/e3f2fd/333?text=Portátil",
        "category": "Electrónica",
    },
    {
        "productId": "headphones-z5",
        "name": "Auriculares Bluetooth Z5",
        "price": 120000,
        "stock": 25,
        "image": "https://placehold.co/200x200/f3e5f5/333?text=Auriculares",
        "category": "Electrónica",
    },
    {
        "productId": "watch-fittrack",
        "name": "Reloj Inteligente FitTrack",
        "price": 350000,
        "stock": 3,
        "image": "https://placehold.co/200x200/fff3e0/333?text=Reloj",
        "category": "Electrónica",
    },
    {
        "productId": "backpack-travel",
        "name": "Mochila de Viaje",
        "price": 90000,
        "stock": 50,
        "image": "https://placehold.co/200x200/efebe9/333?text=Mochila",
        "category": "Deportes",
    },
    {
        "productId": "tshirt-cotton",
        "name": "Camiseta Algodón Hombre",
        "price": 45000,
        "stock": 100,
        "image": "https://placehold.co/200x200/fce4ec/333?text=Camiseta",
        "category": "Ropa",
    },
]

USERS = [
    {
        "email": "admin@ecommerce.com",
        "name": "Administrador",
        "role": "admin",
        "password": "admin123",
    },
    {
        "email": "jgarcia@gmail.com",
        "name": "Juan Garcia",
        "role": "user",
        "password": "user123",
    },
    {
        "email": "ana.mtz@outlook.com",
        "name": "Ana Martinez",
        "role": "user",
        "password": "user123",
    },
    {
        "email": "daniel@unimag.edu.co",
        "name": "Daniel Eduardo",
        "role": "user",
        "password": "user123",
    },
]


async def seed():
    uri = os.environ.get("MONGO_URI")
    if not uri:
        raise RuntimeError("MONGO_URI no está definida en .env")

    client = AsyncIOMotorClient(uri)
    db = client.get_default_database()

    # ── Limpiar colecciones antes de insertar ─────────────────────────────────
    await db.products.delete_many({})
    await db.users.delete_many({})
    await db.orders.delete_many({})
    await db.cart.delete_many({})
    print("🧹 Colecciones limpiadas")

    # ── Productos ─────────────────────────────────────────────────────────────
    for p in PRODUCTS:
        await db.products.insert_one({**p, "_id": p["productId"]})
    print(f"✅ {len(PRODUCTS)} productos insertados")

    # ── Índice único en productId ─────────────────────────────────────────────
    await db.products.create_index("productId", unique=True)

    # ── Usuarios y órdenes de ejemplo ─────────────────────────────────────────
    for i, user in enumerate(USERS):
        email = user["email"]
        await db.users.insert_one({
            "email": email,
            "name": user["name"],
            "role": user["role"],
            "passwordHash": hash_password(user["password"]),
        })

        # Solo usuarios normales tienen orden de ejemplo
        if user["role"] != "admin":
            order_id = f"10{i + 1}"
            await db.orders.insert_one({
                "_id": order_id,
                "orderId": order_id,
                "userId": email,
                "items": [
                    {
                        "productId": "phone-x100",
                        "name": "Teléfono Inteligente X100",
                        "price": 850000,
                        "qty": 1,
                    }
                ],
                "total": 850000,
                "status": "Entregado",
                "createdAt": "2026-04-20T00:00:00Z",
            })

    print(f"✅ {len(USERS)} usuarios insertados")
    print("✅ 3 órdenes de ejemplo insertadas")

    client.close()
    print("\n🌱 Seed completo. MongoDB Atlas está listo.")


if __name__ == "__main__":
    asyncio.run(seed())
