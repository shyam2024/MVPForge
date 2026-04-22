from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage4ModifyRequest, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage4_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage4", tags=["stage4"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage4_generate(project: Project = Depends(get_owned_project)):
    if not project.stage3 or project.stage3.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 3 must be completed first")

    stage = await stage4_service.generate_architecture(project)
    project.stage4 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/modify", response_model=ProjectResponse)
async def stage4_modify(data: Stage4ModifyRequest, project: Project = Depends(get_owned_project)):
    if not project.stage4:
        raise HTTPException(status_code=400, detail="Stage 4 not initialized")

    stage = await stage4_service.modify_architecture(project.stage4, data.prompt)
    project.stage4 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/confirm", response_model=ProjectResponse)
async def stage4_confirm(project: Project = Depends(get_owned_project)):
    if not project.stage4:
        raise HTTPException(status_code=400, detail="Stage 4 not initialized")

    stage = stage4_service.confirm_architecture(project.stage4)
    project.stage4 = stage
    project.current_stage = max(project.current_stage, 5)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
