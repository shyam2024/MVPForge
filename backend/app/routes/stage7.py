from fastapi import APIRouter, HTTPException, Depends
from app.schemas.project import Stage7GenerateRequest, ProjectResponse
from app.models.project import Project
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services import stage7_service
from app.routes.projects import project_to_response
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/stage7", tags=["stage7"])


async def get_owned_project(project_id: str, current_user: User = Depends(get_current_user)) -> Project:
    project = await Project.get(project_id)
    if not project or project.owner_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/generate", response_model=ProjectResponse)
async def stage7_generate(
    data: Stage7GenerateRequest,
    project: Project = Depends(get_owned_project),
):
    if not project.stage6 or project.stage6.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Stage 6 must be completed and validated first")
    if not data.confirm:
        raise HTTPException(status_code=400, detail="Must confirm generation with confirm=true")

    # Set in-progress
    project.stage7 = {"status": "in_progress", "generated_files": [], "test_cases": [], "test_report": {}}
    await project.save()

    stage = await stage7_service.run_generation(project)
    project.stage7 = stage
    project.current_stage = max(project.current_stage, 7)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)


@router.get("/files", response_model=list)
async def list_generated_files(project: Project = Depends(get_owned_project)):
    if not project.stage7:
        raise HTTPException(status_code=404, detail="Stage 7 not started")
    files = project.stage7.get("generated_files", [])
    # Return metadata only (no content) for listing
    return [{"path": f["path"], "language": f.get("language"), "task_id": f.get("task_id")} for f in files]


@router.get("/files/{file_index}")
async def get_file_content(file_index: int, project: Project = Depends(get_owned_project)):
    if not project.stage7:
        raise HTTPException(status_code=404, detail="Stage 7 not started")
    files = project.stage7.get("generated_files", [])
    if file_index >= len(files):
        raise HTTPException(status_code=404, detail="File not found")
    return files[file_index]
