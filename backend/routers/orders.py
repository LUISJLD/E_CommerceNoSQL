# routers/orders.py
# POST /api/orders                           → crear orden desde el carrito
# GET  /api/orders/{order_id}                → obtener orden por ID
# GET  /api/orders/{order_id}/items          → items de una orden
# GET  /api/user/{user_id}/orders            → historial de órdenes del usuario
# GET  /api/admin/orders                     → todas las órdenes (admin)
# PUT  /api/admin/orders/{order_id}/status   → actualizar estado (admin)

import uuid
from datetime import datetime, timedelta
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from config.database import get_db
from config.cache import get_redis
from core.dependencies import get_current_user, require_admin

router = APIRouter(tags=["Orders"])


class CreateOrderBody(BaseModel):
    userId: str


class UpdateStatusBody(BaseModel):
    status: str


async def get_available_stock(db, product_id: str, user_id: str) -> int:
    prod = await db.products.find_one({"productId": product_id})
    if not prod:
        return 0
    
    now = datetime.utcnow()
    # Sumar reservas activas hechas por OTROS usuarios
    pipeline = [
        {"$match": {
            "productId": product_id,
            "userId": {"$ne": user_id},
            "expiresAt": {"$gt": now}
        }},
        {"$group": {"_id": "$productId", "total_holds": {"$sum": "$qty"}}}
    ]
    cursor = db.inventory_holds.aggregate(pipeline)
    res = await cursor.to_list(length=1)
    
    held_qty = res[0]["total_holds"] if res else 0
    return max(0, prod.get("stock", 0) - held_qty)


# ─── Usuario autenticado ─────────────────────────────────────────────────────

@router.post("/checkout/reserve", status_code=200)
async def reserve_inventory(body: CreateOrderBody, _user=Depends(get_current_user)):
    db = get_db()
    user_id = body.userId.lower()

    cart = await db.cart.find_one({"userId": user_id})
    items = cart.get("items", []) if cart else []

    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    # Validar disponibilidad considerando las reservas de otros usuarios
    insufficient_stock_items = []
    for item in items:
        avail = await get_available_stock(db, item["productId"], user_id)
        if avail < item["qty"]:
            prod = await db.products.find_one({"productId": item["productId"]})
            name = prod.get("name", item["productId"]) if prod else item["productId"]
            insufficient_stock_items.append(f"{name} (disponible: {avail}, solicitado: {item['qty']})")

    if insufficient_stock_items:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente (con reservas activas): {', '.join(insufficient_stock_items)}"
        )

    # Crear las reservas temporales por 10 minutos
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    for item in items:
        hold_id = f"{user_id}_{item['productId']}"
        await db.inventory_holds.update_one(
            {"_id": hold_id},
            {"$set": {
                "userId": user_id,
                "productId": item["productId"],
                "qty": item["qty"],
                "expiresAt": expires_at
            }},
            upsert=True
        )

    # Asegurar el índice TTL en la colección de reservas
    await db.inventory_holds.create_index("expiresAt", expireAfterSeconds=0)

    return {"message": "Inventario reservado exitosamente por 10 minutos", "expiresAt": expires_at}


@router.post("/orders", status_code=201)
async def create_order(body: CreateOrderBody, _user=Depends(get_current_user)):
    db = get_db()
    user_id = body.userId.lower()

    cart = await db.cart.find_one({"userId": user_id})
    items = cart.get("items", []) if cart else []

    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    now = datetime.utcnow()

    # 1. Obtener las reservas activas del usuario
    cursor = db.inventory_holds.find({"userId": user_id, "expiresAt": {"$gt": now}})
    user_holds = await cursor.to_list(length=None)
    holds_map = {h["productId"]: h["qty"] for h in user_holds}

    # 2. Validar stock (si tiene reserva que cubra la cantidad, omitir chequeo de stock del catálogo)
    insufficient_stock_items = []
    for item in items:
        pid = item["productId"]
        if pid in holds_map and holds_map[pid] >= item["qty"]:
            continue
        
        # Validar disponibilidad actual en vivo si no tiene reserva activa
        avail = await get_available_stock(db, pid, user_id)
        if avail < item["qty"]:
            prod = await db.products.find_one({"productId": pid})
            name = prod.get("name", pid) if prod else pid
            insufficient_stock_items.append(name)

    if insufficient_stock_items:
        raise HTTPException(
            status_code=400,
            detail=f"La reserva expiró o el stock es insuficiente para: {', '.join(insufficient_stock_items)}"
        )

    # 3. Descontar stock físico atómicamente con rollback
    decremented_items = []
    for item in items:
        res = await db.products.update_one(
            {"productId": item["productId"], "stock": {"$gte": item["qty"]}},
            {"$inc": {"stock": -item["qty"]}},
        )
        if res.modified_count == 0:
            # Rollback
            for dec_item in decremented_items:
                await db.products.update_one(
                    {"productId": dec_item["productId"]},
                    {"$inc": {"stock": dec_item["qty"]}},
                )
            raise HTTPException(
                status_code=400,
                detail="No se pudo procesar la orden debido a un cambio en el inventario de último momento."
            )
        decremented_items.append(item)

    # 4. Registrar la orden
    order_id = str(uuid.uuid4())[:8]
    total = sum(i["price"] * i["qty"] for i in items)

    order = {
        "orderId": order_id,
        "userId": user_id,
        "items": items,
        "total": total,
        "status": "Pendiente",
        "createdAt": now.isoformat() + "Z",
    }

    await db.orders.insert_one({**order, "_id": order_id})

    # 5. Limpiar reservas y vaciar el carrito
    await db.inventory_holds.delete_many({"userId": user_id})
    await db.cart.update_one({"userId": user_id}, {"$set": {"items": []}})
    try:
        r = get_redis()
        await r.delete(f"cart:{user_id}")
    except Exception:
        pass

    return {"message": "Orden creada con éxito", "orderId": order_id, "total": total}


@router.get("/orders/{order_id}")
async def get_order_by_id(order_id: str, _user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"orderId": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order


@router.get("/orders/{order_id}/items")
async def get_order_items(order_id: str, _user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"orderId": order_id}, {"_id": 0, "items": 1})
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return {"source": "DATABASE", "data": order.get("items", [])}


@router.get("/user/{user_id}/orders")
async def get_user_orders(user_id: str, _user=Depends(get_current_user)):
    db = get_db()
    user_id = unquote(user_id).lower()
    cursor = db.orders.find({"userId": user_id}, {"_id": 0}).sort("createdAt", -1)
    orders = await cursor.to_list(length=None)
    return {"source": "DATABASE", "data": orders}


# ─── Admin ───────────────────────────────────────────────────────────────────

@router.get("/admin/orders", dependencies=[Depends(require_admin)])
async def get_all_orders():
    db = get_db()
    cursor = db.orders.find({}, {"_id": 0}).sort("createdAt", -1)
    orders = await cursor.to_list(length=None)
    return {"source": "DATABASE", "data": orders}


@router.put("/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
async def update_order_status(order_id: str, body: UpdateStatusBody):
    db = get_db()
    if not body.status:
        raise HTTPException(status_code=400, detail="Se requiere el nuevo status")

    updated = await db.orders.find_one_and_update(
        {"orderId": order_id},
        {"$set": {"status": body.status}},
        return_document=True,
        projection={"_id": 0},
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    return {"message": "Estado actualizado", "order": updated}
