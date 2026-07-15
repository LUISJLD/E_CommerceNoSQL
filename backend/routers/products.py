# routers/products.py
# GET  /api/products              → catálogo completo
# GET  /api/products?category=X   → filtrado por categoría
# POST /api/admin/products        → crear producto (admin)
# PUT  /api/admin/products/{id}   → actualizar producto (admin)
# DELETE /api/admin/products/{id} → eliminar producto (admin)

import unicodedata
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from config.database import get_db
from core.dependencies import require_admin

router = APIRouter(tags=["Products"])


def _normalize(text: str) -> str:
    """Normaliza texto eliminando acentos y pasando a minúsculas (igual que la Lambda)."""
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.strip().lower()


# ─── Público ────────────────────────────────────────────────────────────────

@router.get("/products")
async def get_products(category: Optional[str] = Query(default=None)):
    db = get_db()

    query = {}
    if category:
        # Búsqueda insensible a acentos usando regex simple
        cat_norm = _normalize(category)
        # Traemos todos y filtramos en Python (igual que la Lambda)
        cursor = db.products.find({}, {"_id": 0})
        all_products = await cursor.to_list(length=None)
        products = [
            p for p in all_products
            if _normalize(p.get("category", "")) == cat_norm
        ]
    else:
        cursor = db.products.find({}, {"_id": 0})
        products = await cursor.to_list(length=None)

    return {"source": "DATABASE", "data": products}


# ─── Admin ───────────────────────────────────────────────────────────────────

class ProductBody(BaseModel):
    name: str
    price: float
    stock: int = 0
    category: str = "General"
    image: Optional[str] = None
    id: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image: Optional[str] = None


@router.post("/admin/products", status_code=201, dependencies=[Depends(require_admin)])
async def create_product(body: ProductBody):
    db = get_db()
    prod_id = body.id or str(uuid.uuid4())[:8]

    product = {
        "productId": prod_id,
        "name": body.name,
        "price": body.price,
        "stock": body.stock,
        "category": body.category,
        "image": body.image or "https://placehold.co/200x200/e8f5e9/333?text=Producto",
    }

    await db.products.insert_one({**product, "_id": prod_id})

    return {"message": "Producto creado", "product": product}


@router.put("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def update_product(product_id: str, body: ProductUpdate):
    db = get_db()

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nada que actualizar")

    result = await db.products.find_one_and_update(
        {"productId": product_id},
        {"$set": updates},
        return_document=True,
        projection={"_id": 0},
    )

    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {"message": "Producto actualizado", "product": result}


@router.delete("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def delete_product(product_id: str):
    db = get_db()
    await db.products.delete_one({"productId": product_id})
    return Response(status_code=204)
