# routers/users.py
# GET /api/users              → todos los usuarios (admin)
# GET /api/users/{user_id}    → perfil de un usuario

from fastapi import APIRouter, Depends, HTTPException
from config.database import get_db
from core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", dependencies=[Depends(require_admin)])
async def get_all_users():
    db = get_db()
    cursor = db.users.find({}, {"_id": 0, "passwordHash": 0})
    users = await cursor.to_list(length=None)
    return {"source": "DATABASE", "data": users}


@router.get("/{user_id}")
async def get_user_profile(user_id: str, _user=Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one(
        {"email": user_id.lower()},
        {"_id": 0, "passwordHash": 0},
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
