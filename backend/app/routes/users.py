from fastapi import APIRouter, HTTPException, status
from datetime import datetime

from app.models.user import User, UserCreate, UserUpdate, UserLogin, UserOut
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    if await User.find_one(User.email == payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    if await User.find_one(User.username == payload.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    await user.insert()
    return _to_out(user)


@router.post("/login")
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(user)

@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = payload.model_dump(exclude_none=True)
    if not changes:
        return _to_out(user)
    
    changes["updated_at"] = datetime.utcnow()
    await user.set(changes)
    return _to_out(user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()


def _to_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        avatar_url=user.avatar_url,
        bio=user.bio,
        created_at=user.created_at
    )