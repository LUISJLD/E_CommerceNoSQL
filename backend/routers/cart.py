# routers/cart.py
# GET    /api/cart/{user_id}              → obtener carrito
# POST   /api/cart/{user_id}              → agregar/actualizar item
# DELETE /api/cart/{user_id}?productId=X  → eliminar item

from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from config.database import get_db

router = APIRouter(prefix="/cart", tags=["Cart"])


class CartItemBody(BaseModel):
    productId: str
    qty: int
    price: float


@router.get("/{user_id}")
async def get_cart(user_id: str):
    db = get_db()
    user_id = unquote(user_id).lower()

    cart = await db.cart.find_one({"userId": user_id}, {"_id": 0})
    items = cart.get("items", []) if cart else []

    return {"source": "DATABASE", "data": items}


@router.post("/{user_id}")
async def add_to_cart(user_id: str, body: CartItemBody):
    db = get_db()
    user_id = unquote(user_id).lower()

    if body.qty is None or body.price is None:
        raise HTTPException(status_code=400, detail="Se requieren qty y price")

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

        await db.cart.update_one({"userId": user_id}, {"$set": {"items": items}})
    else:
        await db.cart.insert_one({
            "userId": user_id,
            "items": [{"productId": body.productId, "qty": body.qty, "price": body.price}],
        })

    return {"message": "Producto agregado al carrito", "productId": body.productId}


@router.delete("/{user_id}")
async def remove_from_cart(
    user_id: str,
    productId: Optional[str] = Query(default=None),
):
    db = get_db()
    user_id = unquote(user_id).lower()

    if not productId:
        raise HTTPException(status_code=400, detail="Falta el parámetro productId")

    await db.cart.update_one(
        {"userId": user_id},
        {"$pull": {"items": {"productId": productId}}},
    )

    return Response(status_code=204)
