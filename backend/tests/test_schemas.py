"""
Unit tests for app/schemas/user.py and app/schemas/project.py
"""

import pytest
from pydantic import ValidationError


# ─── UserRegister ─────────────────────────────────────────────────────────────
class TestUserRegister:
    def test_valid_data(self):
        from app.schemas.user import UserRegister
        u = UserRegister(
            email="a@b.com",
            username="alice",
            full_name="Alice",
            password="secret",
        )
        assert u.email == "a@b.com"

    def test_invalid_email_raises(self):
        from app.schemas.user import UserRegister
        with pytest.raises(ValidationError):
            UserRegister(email="not-an-email", username="a", full_name="A", password="p")

    def test_missing_field_raises(self):
        from app.schemas.user import UserRegister
        with pytest.raises(ValidationError):
            UserRegister(email="a@b.com", username="alice")  # missing full_name & password


# ─── UserLogin ────────────────────────────────────────────────────────────────
class TestUserLogin:
    def test_login_with_email(self):
        from app.schemas.user import UserLogin
        ul = UserLogin(email="a@b.com", password="pw")
        assert ul.email == "a@b.com"
        assert ul.username is None

    def test_login_with_username(self):
        from app.schemas.user import UserLogin
        ul = UserLogin(username="alice", password="pw")
        assert ul.username == "alice"

    def test_neither_email_nor_username_raises(self):
        from app.schemas.user import UserLogin
        with pytest.raises((ValidationError, ValueError)):
            UserLogin(password="pw")

    def test_missing_password_raises(self):
        from app.schemas.user import UserLogin
        with pytest.raises(ValidationError):
            UserLogin(email="a@b.com")


# ─── UserUpdate ───────────────────────────────────────────────────────────────
class TestUserUpdate:
    def test_all_optional(self):
        from app.schemas.user import UserUpdate
        u = UserUpdate()
        assert u.full_name is None
        assert u.bio is None
        assert u.avatar_url is None

    def test_partial_update(self):
        from app.schemas.user import UserUpdate
        u = UserUpdate(bio="Hello")
        assert u.bio == "Hello"
        assert u.full_name is None


# ─── TokenData ────────────────────────────────────────────────────────────────
class TestTokenData:
    def test_valid(self):
        from app.schemas.user import TokenData
        t = TokenData(sub="abc123")
        assert t.sub == "abc123"

    def test_missing_sub_raises(self):
        from app.schemas.user import TokenData
        with pytest.raises(ValidationError):
            TokenData()


# ─── TokenResponse ────────────────────────────────────────────────────────────
class TestTokenResponse:
    def test_defaults(self):
        from app.schemas.user import TokenResponse
        tr = TokenResponse(access_token="jwt.token.here")
        assert tr.token_type == "bearer"
        assert tr.user is None


# ─── Stage1ChatInput ──────────────────────────────────────────────────────────
class TestStage1ChatInput:
    def test_valid_message(self):
        from app.schemas.project import Stage1ChatInput
        s = Stage1ChatInput(message="Hello AI")
        assert s.message == "Hello AI"

    def test_missing_message_raises(self):
        from app.schemas.project import Stage1ChatInput
        with pytest.raises(ValidationError):
            Stage1ChatInput()


# ─── Stage1ProceedInput ───────────────────────────────────────────────────────
class TestStage1ProceedInput:
    def test_default_force_false(self):
        from app.schemas.project import Stage1ProceedInput
        s = Stage1ProceedInput()
        assert s.force is False

    def test_force_true(self):
        from app.schemas.project import Stage1ProceedInput
        s = Stage1ProceedInput(force=True)
        assert s.force is True


# ─── ProjectResponse ──────────────────────────────────────────────────────────
class TestProjectResponse:
    def test_all_stage_fields_optional(self):
        from app.schemas.project import ProjectResponse
        from datetime import datetime
        pr = ProjectResponse(
            id="abc",
            owner_id="uid",
            name="P",
            current_stage=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        assert pr.stage1 is None
        assert pr.stage7 is None

    def test_stage_data_accepted(self):
        from app.schemas.project import ProjectResponse
        from datetime import datetime
        pr = ProjectResponse(
            id="abc",
            owner_id="uid",
            name="P",
            current_stage=2,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            stage1={"status": "completed"},
        )
        assert pr.stage1["status"] == "completed"


# ─── Stage7GenerateRequest ────────────────────────────────────────────────────
class TestStage7GenerateRequest:
    def test_default_confirm_false(self):
        from app.schemas.project import Stage7GenerateRequest
        r = Stage7GenerateRequest()
        assert r.confirm is False

    def test_confirm_true(self):
        from app.schemas.project import Stage7GenerateRequest
        r = Stage7GenerateRequest(confirm=True)
        assert r.confirm is True
