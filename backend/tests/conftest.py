"""
Shared pytest fixtures for MVPForge backend tests.
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from bson import ObjectId


# ─── Fake IDs ────────────────────────────────────────────────────────────────
FAKE_USER_ID = str(ObjectId())
FAKE_PROJECT_ID = str(ObjectId())


# ─── Fake User ────────────────────────────────────────────────────────────────
@pytest.fixture
def fake_user():
    user = MagicMock()
    user.id = ObjectId(FAKE_USER_ID)
    user.email = "test@example.com"
    user.username = "testuser"
    user.full_name = "Test User"
    user.hashed_password = "$2b$12$fakehash"
    user.is_active = True
    user.is_verified = False
    user.avatar_url = None
    user.bio = None
    user.created_at = datetime(2024, 1, 1, 12, 0, 0)
    user.updated_at = datetime(2024, 1, 1, 12, 0, 0)
    user.save = AsyncMock()
    user.delete = AsyncMock()
    user.insert = AsyncMock()
    return user


# ─── Fake Project ─────────────────────────────────────────────────────────────
@pytest.fixture
def fake_project(fake_user):
    project = MagicMock()
    project.id = ObjectId(FAKE_PROJECT_ID)
    project.owner_id = str(fake_user.id)
    project.name = "Test Project"
    project.description = "A test project"
    project.current_stage = 1
    project.stage1 = None
    project.stage2 = None
    project.stage3 = None
    project.stage4 = None
    project.stage5 = None
    project.stage6 = None
    project.stage7 = None
    project.created_at = datetime(2024, 1, 1, 12, 0, 0)
    project.updated_at = datetime(2024, 1, 1, 12, 0, 0)
    project.save = AsyncMock()
    project.delete = AsyncMock()
    project.insert = AsyncMock()
    return project


# ─── JWT token ───────────────────────────────────────────────────────────────
@pytest.fixture
def valid_token():
    from app.middleware.auth import create_access_token
    return create_access_token({"sub": FAKE_USER_ID})
