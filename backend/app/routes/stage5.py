from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage5EditRequest, Stage5ApproveScreen, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage5_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage5", tags=["stage5"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage5_generate(project: Project = Depends(get_owned_project)):
    if not project.stage4 or project.stage4.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 4 must be completed first")

    stage = await stage5_service.generate_ui_screens(project)
    project.stage5 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/screen/edit", response_model=ProjectResponse)
async def edit_screen(data: Stage5EditRequest, project: Project = Depends(get_owned_project)):
    if not project.stage5:
        raise HTTPException(status_code=400, detail="Stage 5 not initialized")
    try:
        stage = await stage5_service.edit_screen(project.stage5, data.screen_id, data.prompt)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    project.stage5 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/screen/approve", response_model=ProjectResponse)
async def approve_screen(data: Stage5ApproveScreen, project: Project = Depends(get_owned_project)):
    if not project.stage5:
        raise HTTPException(status_code=400, detail="Stage 5 not initialized")
    stage = stage5_service.approve_screen(project.stage5, data.screen_id)
    project.stage5 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/confirm", response_model=ProjectResponse)
async def stage5_confirm(project: Project = Depends(get_owned_project)):
    if not project.stage5:
        raise HTTPException(status_code=400, detail="Stage 5 not initialized")
    stage = stage5_service.confirm_ui(project.stage5)
    project.stage5 = stage
    project.current_stage = max(project.current_stage, 6)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
