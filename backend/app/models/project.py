from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class Project(Document):
    owner_id: str
    name: str
    description: Optional[str] = None
    current_stage: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    stage1: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 1: Core problem, target persona, user flow, success metrics"
    )

    stage2: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 2: Epics and features definition"
    )

    stage3: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 3: User stories and backlog"
    )

    stage4: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 4: Technical architecture and API design"
    )

    stage5: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 5: UI/UX design and design system"
    )

    stage6: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 6: Build plan and implementation roadmap"
    )

    stage7: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Stage 7: Code generation and deployment"
    )

    class Settings:
        name = "projects"

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str]
    current_stage: int
    created_at: datetime
    updated_at: datetime