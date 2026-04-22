from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage3StoryMove, Stage3StoryEdit, Stage3RegenerateStory, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage3_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage3", tags=["stage3"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage3_generate(project: Project = Depends(get_owned_project)):
    if not project.stage2 or project.stage2.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 2 must be completed first")

    stage = await stage3_service.generate_backlog(project)
    project.stage3 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.patch("/story/move", response_model=ProjectResponse)
async def move_story(data: Stage3StoryMove, project: Project = Depends(get_owned_project)):
    if not project.stage3:
        raise HTTPException(status_code=400, detail="Stage 3 not initialized")
    stage = stage3_service.move_story(project.stage3, data.story_id, data.new_status)
    project.stage3 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.patch("/story/edit", response_model=ProjectResponse)
async def edit_story(data: Stage3StoryEdit, project: Project = Depends(get_owned_project)):
    if not project.stage3:
        raise HTTPException(status_code=400, detail="Stage 3 not initialized")
    try:
        stage = stage3_service.edit_story_field(project.stage3, data.story_id, data.field, data.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    project.stage3 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/story/regenerate", response_model=ProjectResponse)
async def regenerate_story(data: Stage3RegenerateStory, project: Project = Depends(get_owned_project)):
    if not project.stage3:
        raise HTTPException(status_code=400, detail="Stage 3 not initialized")
    try:
        stage = await stage3_service.regenerate_story(project.stage3, data.story_id, data.prompt)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    project.stage3 = stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/confirm", response_model=ProjectResponse)
async def stage3_confirm(project: Project = Depends(get_owned_project)):
    if not project.stage3:
        raise HTTPException(status_code=400, detail="Stage 3 not initialized")
    stage = stage3_service.confirm_backlog(project.stage3)
    project.stage3 = stage
    project.current_stage = max(project.current_stage, 4)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
