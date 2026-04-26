"""
Unit tests for app/routes/stage1.py
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
    u.email = "user@test.com"
    u.username = "user"
    u.full_name = "User"
    u.is_active = True
    u.is_verified = False
    u.avatar_url = None
    u.bio = None
    u.created_at = NOW
    return u


def make_project(owner_id=None, current_stage=1, stage1=None):
    p = MagicMock()
    p.id = ObjectId(FAKE_PROJECT_ID)
    p.owner_id = owner_id or FAKE_USER_ID
    p.name = "My Project"
    p.description = "Desc"
    p.current_stage = current_stage
    p.stage1 = stage1
    p.stage2 = p.stage3 = p.stage4 = p.stage5 = p.stage6 = p.stage7 = None
    p.created_at = NOW
    p.updated_at = NOW
    p.save = AsyncMock()
    p.delete = AsyncMock()
    return p


# ─── stage1_chat ──────────────────────────────────────────────────────────────
class TestStage1Chat:
    @pytest.mark.asyncio
    async def test_chat_saves_and_returns_project(self):
        from app.routes.stage1 import stage1_chat
        from app.schemas.project import Stage1ChatInput

        project = make_project()
        updated_stage = {"status": "in_progress", "chat_history": [], "readiness_score": 0.1}

        with patch("app.routes.stage1.stage1_service.process_chat", AsyncMock(return_value=updated_stage)):
            data = Stage1ChatInput(message="I want to build a SaaS")
            result = await stage1_chat(data=data, project=project)

        project.save.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_chat_raises_400_if_stage1_already_completed(self):
        from app.routes.stage1 import stage1_chat
        from app.schemas.project import Stage1ChatInput

        completed_stage = {"status": "completed"}
        project = make_project(current_stage=2, stage1=completed_stage)

        data = Stage1ChatInput(message="hello")
        with pytest.raises(HTTPException) as exc:
            await stage1_chat(data=data, project=project)

        assert exc.value.status_code == 400
        assert "completed" in exc.value.detail.lower()


# ─── stage1_proceed ───────────────────────────────────────────────────────────
class TestStage1Proceed:
    @pytest.mark.asyncio
    async def test_proceed_with_high_score_succeeds(self):
        from app.routes.stage1 import stage1_proceed
        from app.schemas.project import Stage1ProceedInput

        stage = {"readiness_score": 0.9, "status": "in_progress"}
        project = make_project(stage1=stage)

        updated_stage = {"status": "completed", "product_vision_document": {}}
        with patch("app.routes.stage1.stage1_service.generate_pvd", AsyncMock(return_value=updated_stage)):
            data = Stage1ProceedInput(force=False)
            result = await stage1_proceed(data=data, project=project)

        project.save.assert_awaited_once()
        assert project.current_stage >= 2

    @pytest.mark.asyncio
    async def test_proceed_with_low_score_raises_400(self):
        from app.routes.stage1 import stage1_proceed
        from app.schemas.project import Stage1ProceedInput

        stage = {"readiness_score": 0.4}
        project = make_project(stage1=stage)

        data = Stage1ProceedInput(force=False)
        with pytest.raises(HTTPException) as exc:
            await stage1_proceed(data=data, project=project)

        assert exc.value.status_code == 400
        assert "0.40" in exc.value.detail or "threshold" in exc.value.detail.lower()

    @pytest.mark.asyncio
    async def test_proceed_with_force_bypasses_threshold(self):
        from app.routes.stage1 import stage1_proceed
        from app.schemas.project import Stage1ProceedInput

        stage = {"readiness_score": 0.3}
        project = make_project(stage1=stage)

        updated_stage = {"status": "completed", "product_vision_document": {}}
        with patch("app.routes.stage1.stage1_service.generate_pvd", AsyncMock(return_value=updated_stage)):
            data = Stage1ProceedInput(force=True)
            await stage1_proceed(data=data, project=project)

        project.save.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_proceed_without_any_chat_raises_400(self):
        from app.routes.stage1 import stage1_proceed
        from app.schemas.project import Stage1ProceedInput

        project = make_project(stage1=None)

        data = Stage1ProceedInput(force=False)
        with pytest.raises(HTTPException) as exc:
            await stage1_proceed(data=data, project=project)

        assert exc.value.status_code == 400
        assert "chat" in exc.value.detail.lower()
