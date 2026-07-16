# routers/auth.py
# POST /api/auth/register
# POST /api/auth/login

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from config.database import get_db
from core.security import hash_password, create_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    name: str = Field("Usuario", min_length=2, max_length=50)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=201)
async def register(body: RegisterBody):
    db = get_db()
    email = body.email.lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    await db.users.insert_one({
        "email": email,
        "name": body.name,
        "passwordHash": hash_password(body.password),
        "role": "user",
        "address": "",
    })

    return {"message": "Usuario registrado exitosamente"}


@router.post("/login")
async def login(body: LoginBody):
    db = get_db()
    email = body.email.lower()

    user = await db.users.find_one({"email": email})
    if not user or user.get("passwordHash") != hash_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token = create_token(user)

    return {
        "message": "Login exitoso",
        "token": token,
        "user": {
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "user"),
        },
    }
