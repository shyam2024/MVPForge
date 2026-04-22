from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage2ToggleFeature, Stage2ConfirmInput, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage2_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage2", tags=["stage2"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage2_generate(project: Project = Depends(get_owned_project)):
    if not project.stage1 or project.stage1.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 1 must be completed first")

    stage = await stage2_service.generate_features(project)
    project.stage2 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.patch("/feature", response_model=ProjectResponse)
async def toggle_feature(
    data: Stage2ToggleFeature,
    project: Project = Depends(get_owned_project),
):
    if not project.stage2:
        raise HTTPException(status_code=400, detail="Stage 2 not initialized")

    stage = stage2_service.toggle_feature(project.stage2, data.epic_id, data.feature_id, data.enabled)
    project.stage2 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/confirm", response_model=ProjectResponse)
async def stage2_confirm(project: Project = Depends(get_owned_project)):
    if not project.stage2:
        raise HTTPException(status_code=400, detail="Stage 2 not initialized")

    stage = stage2_service.build_manifesto(project.stage2)
    project.stage2 = stage
    project.current_stage = max(project.current_stage, 3)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
