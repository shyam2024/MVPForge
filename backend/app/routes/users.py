from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from app.models.user import User, UserUpdate, UserOut
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile"""
    return _to_out(current_user)

@router.patch("/me", response_model=UserOut)
async def update_current_user_profile(payload: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update the current authenticated user's profile"""
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return _to_out(current_user)

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    # Validate that user_id is a valid MongoDB ObjectId
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await User.get(object_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(user)

@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, current_user: User = Depends(get_current_user)):
    # Validate that user_id is a valid MongoDB ObjectId
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Only allow users to update their own profile
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    user = await User.get(object_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = payload.model_dump(exclude_none=True)
    if not changes:
        return _to_out(user)
    
    changes["updated_at"] = datetime.utcnow()
    await user.set(changes)
    return _to_out(user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Validate that user_id is a valid MongoDB ObjectId
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Only allow users to delete their own profile
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    user = await User.get(object_id)
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