from fastapi import APIRouter, Depends
from app.models.project import Project
from app.schemas.project import ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])

def project_to_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=str(project.id),
        owner_id=project.owner_id,
        name=project.name,
        description=project.description,
        current_stage=project.current_stage,
        created_at=project.created_at,
        updated_at=project.updated_at,
        stage1=project.stage1,
        stage2=project.stage2,
        stage3=project.stage3,
        stage4=project.stage4,
        stage5=project.stage5,
        stage6=project.stage6,
        stage7=project.stage7,
    )

@router.get("/")
async def list_projects():
    return {"projects": []}