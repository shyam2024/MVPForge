"""
Unit tests for app/routes/users.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException


# ─── Helpers ──────────────────────────────────────────────────────────────────
FAKE_USER_ID = str(ObjectId())
NOW = datetime(2024, 1, 1)


def make_user(user_id=None):
    u = MagicMock()
    uid = user_id or FAKE_USER_ID
    u.id = ObjectId(uid)
    u.email = "user@test.com"
    u.username = "testuser"
    u.full_name = "Test User"
    u.is_active = True
    u.is_verified = False
    u.avatar_url = None
    u.bio = None
    u.created_at = NOW
    u.updated_at = NOW
    u.save = AsyncMock()
    u.delete = AsyncMock()
    u.set = AsyncMock()
    return u


# ─── get_current_user_profile ────────────────────────────────────────────────
class TestGetCurrentUserProfile:
    @pytest.mark.asyncio
    async def test_returns_user_profile(self):
        from app.routes.users import get_current_user_profile

        user = make_user()
        result = await get_current_user_profile(current_user=user)

        assert result.email == user.email
        assert result.username == user.username
        assert result.full_name == user.full_name


# ─── update_current_user_profile ─────────────────────────────────────────────
class TestUpdateCurrentUserProfile:
    @pytest.mark.asyncio
    async def test_updates_full_name(self):
        from app.routes.users import update_current_user_profile
        from app.models.user import UserUpdate

        user = make_user()
        payload = UserUpdate(full_name="Updated")
        result = await update_current_user_profile(payload=payload, current_user=user)

        assert user.full_name == "Updated"
        user.save.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_updates_bio(self):
        from app.routes.users import update_current_user_profile
        from app.models.user import UserUpdate

        user = make_user()
        payload = UserUpdate(bio="My bio")
        await update_current_user_profile(payload=payload, current_user=user)
        assert user.bio == "My bio"

    @pytest.mark.asyncio
    async def test_updates_avatar_url(self):
        from app.routes.users import update_current_user_profile
        from app.models.user import UserUpdate

        user = make_user()
        payload = UserUpdate(avatar_url="https://img.com/pic.png")
        await update_current_user_profile(payload=payload, current_user=user)
        assert user.avatar_url == "https://img.com/pic.png"


# ─── get_user ─────────────────────────────────────────────────────────────────
class TestGetUser:
    @pytest.mark.asyncio
    async def test_returns_user_by_id(self):
        from app.routes.users import get_user

        user = make_user()
        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=user)
            result = await get_user(user_id=FAKE_USER_ID)

        assert result.email == user.email

    @pytest.mark.asyncio
    async def test_invalid_object_id_raises_400(self):
        from app.routes.users import get_user

        with pytest.raises(HTTPException) as exc:
            await get_user(user_id="not-an-objectid")

        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_user_not_found_raises_404(self):
        from app.routes.users import get_user

        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=None)
            with pytest.raises(HTTPException) as exc:
                await get_user(user_id=FAKE_USER_ID)

        assert exc.value.status_code == 404


# ─── update_user ──────────────────────────────────────────────────────────────
class TestUpdateUser:
    @pytest.mark.asyncio
    async def test_owner_can_update(self):
        from app.routes.users import update_user
        from app.models.user import UserUpdate

        user = make_user()
        current_user = make_user()  # same ID
        current_user.id = user.id

        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=user)
            payload = UserUpdate(full_name="New Name")
            result = await update_user(
                user_id=FAKE_USER_ID, payload=payload, current_user=current_user
            )

        user.set.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_other_user_raises_403(self):
        from app.routes.users import update_user
        from app.models.user import UserUpdate

        current_user = make_user(user_id=str(ObjectId()))  # different ID

        payload = UserUpdate(full_name="Hacker")
        with pytest.raises(HTTPException) as exc:
            await update_user(
                user_id=FAKE_USER_ID, payload=payload, current_user=current_user
            )

        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_invalid_id_raises_400(self):
        from app.routes.users import update_user
        from app.models.user import UserUpdate

        current_user = make_user()
        payload = UserUpdate(full_name="X")
        with pytest.raises(HTTPException) as exc:
            await update_user(
                user_id="bad-id", payload=payload, current_user=current_user
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_empty_payload_returns_existing_user(self):
        from app.routes.users import update_user
        from app.models.user import UserUpdate

        user = make_user()
        current_user = make_user()
        current_user.id = user.id

        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=user)
            payload = UserUpdate()  # nothing to change
            result = await update_user(
                user_id=FAKE_USER_ID, payload=payload, current_user=current_user
            )

        user.set.assert_not_awaited()  # no changes → no save


# ─── delete_user ──────────────────────────────────────────────────────────────
class TestDeleteUser:
    @pytest.mark.asyncio
    async def test_owner_can_delete(self):
        from app.routes.users import delete_user

        user = make_user()
        current_user = make_user()
        current_user.id = user.id

        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=user)
            await delete_user(user_id=FAKE_USER_ID, current_user=current_user)

        user.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_other_user_raises_403(self):
        from app.routes.users import delete_user

        current_user = make_user(user_id=str(ObjectId()))

        with pytest.raises(HTTPException) as exc:
            await delete_user(user_id=FAKE_USER_ID, current_user=current_user)

        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_not_found_raises_404(self):
        from app.routes.users import delete_user

        current_user = make_user()

        with patch("app.routes.users.User") as MockUser:
            MockUser.get = AsyncMock(return_value=None)
            with pytest.raises(HTTPException) as exc:
                await delete_user(user_id=FAKE_USER_ID, current_user=current_user)

        assert exc.value.status_code == 404
