# routers/orders.py
# POST /api/orders                           → crear orden desde el carrito
# GET  /api/orders/{order_id}                → obtener orden por ID
# GET  /api/orders/{order_id}/items          → items de una orden
# GET  /api/user/{user_id}/orders            → historial de órdenes del usuario
# GET  /api/admin/orders                     → todas las órdenes (admin)
# PUT  /api/admin/orders/{order_id}/status   → actualizar estado (admin)

import uuid
from datetime import datetime
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from config.database import get_db
from core.dependencies import get_current_user, require_admin

router = APIRouter(tags=["Orders"])


class CreateOrderBody(BaseModel):
    userId: str


class UpdateStatusBody(BaseModel):
    status: str


# ─── Usuario autenticado ─────────────────────────────────────────────────────

@router.post("/orders", status_code=201)
async def create_order(body: CreateOrderBody, _user=Depends(get_current_user)):
    db = get_db()
    user_id = body.userId.lower()

    cart = await db.cart.find_one({"userId": user_id})
    items = cart.get("items", []) if cart else []

    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    order_id = str(uuid.uuid4())[:8]
    total = sum(i["price"] * i["qty"] for i in items)

    order = {
        "orderId": order_id,
        "userId": user_id,
        "items": items,
        "total": total,
        "status": "Pendiente",
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }

    await db.orders.insert_one({**order, "_id": order_id})

    # Descontar stock de cada producto
    for item in items:
        await db.products.update_one(
            {"productId": item["productId"], "stock": {"$gte": item["qty"]}},
            {"$inc": {"stock": -item["qty"]}},
        )

    # Vaciar carrito
    await db.cart.update_one({"userId": user_id}, {"$set": {"items": []}})

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
