# routers/cart.py
# GET    /api/cart/{user_id}              → obtener carrito
# POST   /api/cart/{user_id}              → agregar/actualizar item
# DELETE /api/cart/{user_id}?productId=X  → eliminar item

from datetime import datetime
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
from typing import Optional
from config.database import get_db
from config.cache import cache_aside, get_redis

router = APIRouter(prefix="/cart", tags=["Cart"])

# TTL de 2 días (48 horas = 172.800 segundos)
CART_TTL_SECONDS = 172800


class CartItemBody(BaseModel):
    productId: str
    qty: int
    price: float


async def _invalidate(user_id: str):
    try:
        r = get_redis()
        await r.delete(f"cart:{user_id}")
    except Exception:
        pass


async def _ensure_ttl_index(db):
    try:
        await db.cart.create_index("updatedAt", expireAfterSeconds=CART_TTL_SECONDS)
    except Exception:
        pass


@router.get("/{user_id}")
async def get_cart(user_id: str, response: Response):
    db = get_db()
    user_id = unquote(user_id).lower()
    cache_key = f"cart:{user_id}"

    async def _fetch():
        cart = await db.cart.find_one({"userId": user_id}, {"_id": 0})
        return cart.get("items", []) if cart else []

    result = await cache_aside(cache_key, _fetch, ttl=300)
    source = result["source"]
    data = result["data"]

    response.headers["X-Cache-Source"] = source
    return {"source": source, "data": data}


@router.post("/{user_id}")
async def add_to_cart(user_id: str, body: CartItemBody):
    db = get_db()
    user_id = unquote(user_id).lower()
    now = datetime.utcnow()

    if body.qty is None or body.price is None:
        raise HTTPException(status_code=400, detail="Se requieren qty y price")

    await _ensure_ttl_index(db)
    cart = await db.cart.find_one({"userId": user_id})

    if cart:
        items = cart.get("items", [])
        existing = next((i for i in items if i["productId"] == body.productId), None)
        if existing:
            existing["qty"] += body.qty
        else:
            items.append({
                "productId": body.productId,
                "qty": body.qty,
                "price": body.price,
            })

        await db.cart.update_one(
            {"userId": user_id},
            {"$set": {"items": items, "updatedAt": now}}
        )
    else:
        await db.cart.insert_one({
            "userId": user_id,
            "items": [{"productId": body.productId, "qty": body.qty, "price": body.price}],
            "updatedAt": now,
        })

    await _invalidate(user_id)
    return {"message": "Producto agregado al carrito", "productId": body.productId}


@router.delete("/{user_id}")
async def remove_from_cart(
    user_id: str,
    productId: Optional[str] = Query(default=None),
):
    db = get_db()
    user_id = unquote(user_id).lower()
    now = datetime.utcnow()

    if not productId:
        raise HTTPException(status_code=400, detail="Falta el parámetro productId")

    await _ensure_ttl_index(db)
    await db.cart.update_one(
        {"userId": user_id},
        {
            "$pull": {"items": {"productId": productId}},
            "$set": {"updatedAt": now}
        },
    )

    await _invalidate(user_id)
    return Response(status_code=204)
