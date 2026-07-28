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


from pydantic import BaseModel, Field
from core.security import hash_password

class ProfileUpdate(BaseModel):
    phone: str = Field(default="", max_length=20)
    addresses: list[str] = Field(default_factory=list)
    currentPassword: str = Field(default="", max_length=100)
    password: str = Field(default="", max_length=100)


@router.put("/profile")
async def update_profile(body: ProfileUpdate, current_user = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"].lower()
    
    if len(body.addresses) > 3:
        raise HTTPException(status_code=400, detail="Solo puedes guardar un máximo de 3 direcciones")
        
    update_data = {
        "phone": body.phone,
        "addresses": body.addresses
    }
    
    if body.password.strip():
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
            
        db_user = await db.users.find_one({"email": email})
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        if hash_password(body.currentPassword) != db_user.get("passwordHash"):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
            
        update_data["passwordHash"] = hash_password(body.password)

    updated = await db.users.find_one_and_update(
        {"email": email},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0, "passwordHash": 0}
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "message": "Perfil actualizado exitosamente", 
        "user": updated
    }
