"""
Unit tests for app/routes/auth.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

# ─── Shared fake data ─────────────────────────────────────────────────────────
FAKE_ID = str(ObjectId())
NOW = datetime(2024, 6, 1, 0, 0, 0)


def make_fake_user(overrides=None):
    user = MagicMock()
    user.id = ObjectId(FAKE_ID)
    user.email = "user@example.com"
    user.username = "testuser"
    user.full_name = "Test User"
    user.hashed_password = "hashed"
    user.is_active = True
    user.is_verified = False
    user.avatar_url = None
    user.bio = None
    user.created_at = NOW
    user.updated_at = NOW
    user.insert = AsyncMock()
    user.save = AsyncMock()
    if overrides:
        for k, v in overrides.items():
            setattr(user, k, v)
    return user


# ─── register ─────────────────────────────────────────────────────────────────
class TestRegister:
    @pytest.mark.asyncio
    async def test_successful_registration(self):
        from app.routes.auth import register
        from app.schemas.user import UserRegister

        fake_user = make_fake_user()

        with patch("app.routes.auth.User") as MockUser, \
             patch("app.routes.auth.hash_password", return_value="hashed"), \
             patch("app.routes.auth.create_access_token", return_value="tok"):

            MockUser.find_one = AsyncMock(return_value=None)
            MockUser.return_value = fake_user

            data = UserRegister(
                email="user@example.com",
                username="testuser",
                full_name="Test User",
                password="password123",
            )
            result = await register(data)

        assert result.access_token == "tok"
        assert result.user.email == "user@example.com"

    @pytest.mark.asyncio
    async def test_duplicate_email_raises_400(self):
        from app.routes.auth import register
        from app.schemas.user import UserRegister

        with patch("app.routes.auth.User") as MockUser:
            MockUser.find_one = AsyncMock(return_value=make_fake_user())

            data = UserRegister(
                email="user@example.com",
                username="testuser",
                full_name="Test User",
                password="password123",
            )
            with pytest.raises(HTTPException) as exc:
                await register(data)
        assert exc.value.status_code == 400
        assert "Email" in exc.value.detail

    @pytest.mark.asyncio
    async def test_duplicate_username_raises_400(self):
        from app.routes.auth import register
        from app.schemas.user import UserRegister

        call_count = 0

        async def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return None  # email not taken
            return make_fake_user()  # username taken

        with patch("app.routes.auth.User") as MockUser:
            MockUser.find_one = AsyncMock(side_effect=side_effect)
            data = UserRegister(
                email="new@example.com",
                username="taken",
                full_name="Test",
                password="pass",
            )
            with pytest.raises(HTTPException) as exc:
                await register(data)
        assert exc.value.status_code == 400
        assert "Username" in exc.value.detail


# ─── login ────────────────────────────────────────────────────────────────────
class TestLogin:
    @pytest.mark.asyncio
    async def test_successful_login_by_email(self):
        from app.routes.auth import login
        from app.schemas.user import UserLogin

        fake_user = make_fake_user()

        with patch("app.routes.auth.User") as MockUser, \
             patch("app.routes.auth.verify_password", return_value=True), \
             patch("app.routes.auth.create_access_token", return_value="tok"):

            MockUser.find_one = AsyncMock(return_value=fake_user)

            data = UserLogin(email="user@example.com", password="password123")
            result = await login(data)

        assert result.access_token == "tok"

    @pytest.mark.asyncio
    async def test_successful_login_by_username(self):
        from app.routes.auth import login
        from app.schemas.user import UserLogin

        fake_user = make_fake_user()

        with patch("app.routes.auth.User") as MockUser, \
             patch("app.routes.auth.verify_password", return_value=True), \
             patch("app.routes.auth.create_access_token", return_value="tok"):

            MockUser.find_one = AsyncMock(return_value=fake_user)
            data = UserLogin(username="testuser", password="password123")
            result = await login(data)

        assert result.access_token == "tok"

    @pytest.mark.asyncio
    async def test_wrong_password_raises_401(self):
        from app.routes.auth import login
        from app.schemas.user import UserLogin

        fake_user = make_fake_user()

        with patch("app.routes.auth.User") as MockUser, \
             patch("app.routes.auth.verify_password", return_value=False):

            MockUser.find_one = AsyncMock(return_value=fake_user)
            data = UserLogin(email="user@example.com", password="wrong")
            with pytest.raises(HTTPException) as exc:
                await login(data)
        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_user_not_found_raises_401(self):
        from app.routes.auth import login
        from app.schemas.user import UserLogin

        with patch("app.routes.auth.User") as MockUser:
            MockUser.find_one = AsyncMock(return_value=None)
            data = UserLogin(email="ghost@example.com", password="pass")
            with pytest.raises(HTTPException) as exc:
                await login(data)
        assert exc.value.status_code == 401


# ─── get_me ───────────────────────────────────────────────────────────────────
class TestGetMe:
    @pytest.mark.asyncio
    async def test_returns_user_response(self):
        from app.routes.auth import get_me

        fake_user = make_fake_user()
        result = await get_me(current_user=fake_user)

        assert result.email == fake_user.email
        assert result.username == fake_user.username


# ─── update_me ────────────────────────────────────────────────────────────────
class TestUpdateMe:
    @pytest.mark.asyncio
    async def test_updates_full_name(self):
        from app.routes.auth import update_me
        from app.schemas.user import UserUpdate

        fake_user = make_fake_user()
        data = UserUpdate(full_name="Updated Name")
        result = await update_me(data=data, current_user=fake_user)

        fake_user.save.assert_awaited_once()
        assert result.full_name == "Updated Name"

    @pytest.mark.asyncio
    async def test_updates_bio(self):
        from app.routes.auth import update_me
        from app.schemas.user import UserUpdate

        fake_user = make_fake_user()
        data = UserUpdate(bio="New bio")
        await update_me(data=data, current_user=fake_user)
        assert fake_user.bio == "New bio"

    @pytest.mark.asyncio
    async def test_updates_avatar_url(self):
        from app.routes.auth import update_me
        from app.schemas.user import UserUpdate

        fake_user = make_fake_user()
        data = UserUpdate(avatar_url="https://example.com/avatar.png")
        await update_me(data=data, current_user=fake_user)
        assert fake_user.avatar_url == "https://example.com/avatar.png"
