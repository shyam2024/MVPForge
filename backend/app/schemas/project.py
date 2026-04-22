from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class Stage1ChatInput(BaseModel):
    message: str = Field(..., description="User message for Stage 1 discovery chat")

class Stage1ProceedInput(BaseModel):
    force: bool = Field(default=False, description="Force proceed even if readiness score is below threshold")

class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    current_stage: int
    created_at: datetime
    updated_at: datetime
    stage1: Optional[Dict[str, Any]] = None
    stage2: Optional[Dict[str, Any]] = None
    stage3: Optional[Dict[str, Any]] = None
    stage4: Optional[Dict[str, Any]] = None
    stage5: Optional[Dict[str, Any]] = None
    stage6: Optional[Dict[str, Any]] = None
    stage7: Optional[Dict[str, Any]] = None

    class Config:
        arbitrary_types_allowed = True