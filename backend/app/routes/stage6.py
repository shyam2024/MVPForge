from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage6EditTask, Stage6EditManifest, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage6_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage6", tags=["stage6"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage6_generate(project: Project = Depends(get_owned_project)):
    if not project.stage5 or project.stage5.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 5 must be completed first")

    stage = await stage6_service.generate_master_plan(project)
    project.stage6 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/validate", response_model=ProjectResponse)
async def validate_manifest(project: Project = Depends(get_owned_project)):
    if not project.stage6:
        raise HTTPException(status_code=400, detail="Stage 6 not initialized")
    stage = stage6_service.validate_manifest(project.stage6)
    project.stage6 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.patch("/task", response_model=ProjectResponse)
async def edit_task(data: Stage6EditTask, project: Project = Depends(get_owned_project)):
    if not project.stage6:
        raise HTTPException(status_code=400, detail="Stage 6 not initialized")
    stage = stage6_service.edit_task(project.stage6, data.task_id, data.updates)
    project.stage6 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.patch("/manifest", response_model=ProjectResponse)
async def edit_manifest(data: Stage6EditManifest, project: Project = Depends(get_owned_project)):
    if not project.stage6:
        raise HTTPException(status_code=400, detail="Stage 6 not initialized")
    stage = stage6_service.edit_manifest(project.stage6, data.updates)
    project.stage6 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/confirm", response_model=ProjectResponse)
async def stage6_confirm(project: Project = Depends(get_owned_project)):
    if not project.stage6:
        raise HTTPException(status_code=400, detail="Stage 6 not initialized")
    try:
        stage = stage6_service.confirm_manifest(project.stage6)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    project.stage6 = stage
    project.current_stage = max(project.current_stage, 7)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
