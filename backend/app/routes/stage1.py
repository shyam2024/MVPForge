from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage1ChatInput, Stage1ProceedInput
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage1_service
from app.routes.projects import project_to_response
from app.schemas.project import ProjectResponse
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage1", tags=["stage1"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/chat", response_model=ProjectResponse)
async def stage1_chat(
    data: Stage1ChatInput,
    project: Project = Depends(get_owned_project),
):
    if project.current_stage > 1 and project.stage1 and project.stage1.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Stage 1 already completed")

    updated_stage = await stage1_service.process_chat(project, data.message)
    project.stage1 = updated_stage
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.post("/proceed", response_model=ProjectResponse)
async def stage1_proceed(
    data: Stage1ProceedInput,
    project: Project = Depends(get_owned_project),
):
    if not project.stage1:
        raise HTTPException(status_code=400, detail="No discovery chat found. Start chatting first.")

    score = project.stage1.get("readiness_score", 0)
    if score < 0.85 and not data.force:
        raise HTTPException(
            status_code=400,
            detail=f"Readiness score {score:.2f} is below 0.85 threshold. Continue the discovery chat or use force=true to proceed anyway."
        )

    # Generate PVD
    updated_stage = await stage1_service.generate_pvd(project)
    project.stage1 = updated_stage
    project.current_stage = max(project.current_stage, 2)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)
