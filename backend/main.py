"""
main.py — Punto de entrada del servidor FastAPI
Desplegado como funciones serverless en Vercel.
"""
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, products, cart, orders, users

app = FastAPI(
    title="NexusCart API",
    version="2.0.0",
    description="Backend migrado de Lambda + DynamoDB a FastAPI + MongoDB Atlas",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://e-commerce-no-sql-client.vercel.app",
        FRONTEND_URL,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(cart.router,     prefix="/api")
app.include_router(orders.router,   prefix="/api")
app.include_router(users.router,    prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "NexusCart API v2"}
