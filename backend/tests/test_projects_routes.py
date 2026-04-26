"""
Unit tests for app/routes/projects.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException


# ─── Helpers ──────────────────────────────────────────────────────────────────
FAKE_USER_ID = str(ObjectId())
FAKE_PROJECT_ID = str(ObjectId())
NOW = datetime(2024, 1, 1)


def make_user():
    u = MagicMock()
    u.id = ObjectId(FAKE_USER_ID)
    u.email = "owner@test.com"
    u.username = "owner"
    u.full_name = "Owner"
    u.is_active = True
    u.is_verified = False
    u.avatar_url = None
    u.bio = None
    u.created_at = NOW
    return u


def make_project(owner_id=None):
    p = MagicMock()
    p.id = ObjectId(FAKE_PROJECT_ID)
    p.owner_id = owner_id or FAKE_USER_ID
    p.name = "Test Project"
    p.description = "Desc"
    p.current_stage = 1
    p.stage1 = p.stage2 = p.stage3 = p.stage4 = p.stage5 = p.stage6 = p.stage7 = None
    p.created_at = NOW
    p.updated_at = NOW
    p.save = AsyncMock()
    p.delete = AsyncMock()
    p.insert = AsyncMock()
    return p


# ─── list_projects ────────────────────────────────────────────────────────────
class TestListProjects:
    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        from app.routes.projects import list_projects

        user = make_user()

        with patch("app.routes.projects.Project") as MockProject:
            mock_find = MagicMock()
            mock_find.to_list = AsyncMock(return_value=[])
            MockProject.find.return_value = mock_find

            result = await list_projects(current_user=user)

        assert result == []

    @pytest.mark.asyncio
    async def test_returns_projects_for_user(self):
        from app.routes.projects import list_projects

        user = make_user()
        proj = make_project()

        with patch("app.routes.projects.Project") as MockProject:
            mock_find = MagicMock()
            mock_find.to_list = AsyncMock(return_value=[proj])
            MockProject.find.return_value = mock_find

            result = await list_projects(current_user=user)

        assert len(result) == 1
        assert result[0].name == "Test Project"


# ─── create_project ───────────────────────────────────────────────────────────
class TestCreateProject:
    @pytest.mark.asyncio
    async def test_creates_successfully(self):
        from app.routes.projects import create_project
        from app.models.project import ProjectCreate

        user = make_user()
        proj = make_project()

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.find_one = AsyncMock(return_value=None)
            MockProject.return_value = proj

            data = ProjectCreate(name="Test Project", description="Desc")
            result = await create_project(data=data, current_user=user)

        assert result.name == "Test Project"

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_409(self):
        from app.routes.projects import create_project
        from app.models.project import ProjectCreate

        user = make_user()
        existing = make_project()

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.find_one = AsyncMock(return_value=existing)

            data = ProjectCreate(name="Test Project")
            with pytest.raises(HTTPException) as exc:
                await create_project(data=data, current_user=user)

        assert exc.value.status_code == 409


# ─── get_project ──────────────────────────────────────────────────────────────
class TestGetProject:
    @pytest.mark.asyncio
    async def test_returns_project_for_owner(self):
        from app.routes.projects import get_project

        user = make_user()
        proj = make_project(owner_id=FAKE_USER_ID)

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            result = await get_project(project_id=FAKE_PROJECT_ID, current_user=user)

        assert result.id == str(proj.id)

    @pytest.mark.asyncio
    async def test_not_found_raises_404(self):
        from app.routes.projects import get_project

        user = make_user()

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=None)
            with pytest.raises(HTTPException) as exc:
                await get_project(project_id=FAKE_PROJECT_ID, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_wrong_owner_raises_403(self):
        from app.routes.projects import get_project

        user = make_user()
        proj = make_project(owner_id=str(ObjectId()))  # different owner

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            with pytest.raises(HTTPException) as exc:
                await get_project(project_id=FAKE_PROJECT_ID, current_user=user)

        assert exc.value.status_code == 403


# ─── update_project ───────────────────────────────────────────────────────────
class TestUpdateProject:
    @pytest.mark.asyncio
    async def test_updates_name_successfully(self):
        from app.routes.projects import update_project
        from app.models.project import ProjectUpdate

        user = make_user()
        proj = make_project(owner_id=FAKE_USER_ID)

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            MockProject.find_one = AsyncMock(return_value=None)

            data = ProjectUpdate(name="New Name")
            result = await update_project(project_id=FAKE_PROJECT_ID, data=data, current_user=user)

        proj.save.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found_raises_404(self):
        from app.routes.projects import update_project
        from app.models.project import ProjectUpdate

        user = make_user()

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=None)
            data = ProjectUpdate(name="New")
            with pytest.raises(HTTPException) as exc:
                await update_project(project_id=FAKE_PROJECT_ID, data=data, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_wrong_owner_raises_403(self):
        from app.routes.projects import update_project
        from app.models.project import ProjectUpdate

        user = make_user()
        proj = make_project(owner_id=str(ObjectId()))

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            data = ProjectUpdate(name="New")
            with pytest.raises(HTTPException) as exc:
                await update_project(project_id=FAKE_PROJECT_ID, data=data, current_user=user)

        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_409(self):
        from app.routes.projects import update_project
        from app.models.project import ProjectUpdate

        user = make_user()
        proj = make_project(owner_id=FAKE_USER_ID)
        proj.name = "Old Name"

        another_proj = make_project(owner_id=FAKE_USER_ID)
        another_proj.name = "Taken Name"

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            MockProject.find_one = AsyncMock(return_value=another_proj)

            data = ProjectUpdate(name="Taken Name")
            with pytest.raises(HTTPException) as exc:
                await update_project(project_id=FAKE_PROJECT_ID, data=data, current_user=user)

        assert exc.value.status_code == 409


# ─── delete_project ───────────────────────────────────────────────────────────
class TestDeleteProject:
    @pytest.mark.asyncio
    async def test_deletes_successfully(self):
        from app.routes.projects import delete_project

        user = make_user()
        proj = make_project(owner_id=FAKE_USER_ID)

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            await delete_project(project_id=FAKE_PROJECT_ID, current_user=user)

        proj.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_not_found_raises_404(self):
        from app.routes.projects import delete_project

        user = make_user()

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=None)
            with pytest.raises(HTTPException) as exc:
                await delete_project(project_id=FAKE_PROJECT_ID, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_wrong_owner_raises_403(self):
        from app.routes.projects import delete_project

        user = make_user()
        proj = make_project(owner_id=str(ObjectId()))

        with patch("app.routes.projects.Project") as MockProject:
            MockProject.get = AsyncMock(return_value=proj)
            with pytest.raises(HTTPException) as exc:
                await delete_project(project_id=FAKE_PROJECT_ID, current_user=user)

        assert exc.value.status_code == 403
