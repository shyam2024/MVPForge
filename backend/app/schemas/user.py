from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TokenData(BaseModel):
    sub: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional['UserResponse'] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        arbitrary_types_allowed = True