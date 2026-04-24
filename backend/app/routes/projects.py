from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.models.user import User
from app.schemas.project import ProjectResponse
from app.middleware.auth import get_current_user

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

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(current_user: User = Depends(get_current_user)):
    """Get all projects for the current user"""
    projects = await Project.find(Project.owner_id == str(current_user.id)).to_list()
    return [project_to_response(project) for project in projects]

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    # Check if project name already exists for this user
    existing = await Project.find_one(
        Project.owner_id == str(current_user.id),
        Project.name == data.name
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project name already exists"
        )
    
    project = Project(
        owner_id=str(current_user.id),
        name=data.name,
        description=data.description,
        current_stage=1,
    )
    await project.insert()
    return project_to_response(project)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific project by ID"""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify ownership
    if project.owner_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    return project_to_response(project)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update project details"""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify ownership
    if project.owner_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Check if new name conflicts with another project
    if data.name and data.name != project.name:
        existing = await Project.find_one(
            Project.owner_id == str(current_user.id),
            Project.name == data.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project name already exists"
            )
        project.name = data.name
    
    if data.description is not None:
        project.description = data.description
    
    project.updated_at = datetime.utcnow()
    await project.save()
    return project_to_response(project)

@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a project"""
    project = await Project.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify ownership
    if project.owner_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )
    
    await project.delete()