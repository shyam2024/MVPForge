from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class User(Document):
    email = Indexed(EmailStr, unique=True)
    username = Indexed(str, unique=True)
    full_name: str
    hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

    class Config:
        arbitrary_types_allowed = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    bio: Optional[str]
    created_at: datetime