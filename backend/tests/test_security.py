"""
Unit tests for app/utils/security.py
"""

import pytest
from datetime import timedelta, datetime
from jose import jwt

# Patch settings before import
import sys
from unittest.mock import patch, MagicMock

# Provide a minimal settings mock so the module imports cleanly
mock_settings = MagicMock()
mock_settings.JWT_SECRET_KEY = "test-secret-key-for-testing"
mock_settings.JWT_ALGORITHM = "HS256"
mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 1440

with patch.dict("sys.modules", {"config.settings": MagicMock(settings=mock_settings)}):
    from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token


class TestHashPassword:
    def test_returns_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)

    def test_hashed_differs_from_plain(self):
        plain = "mypassword"
        assert hash_password(plain) != plain

    def test_two_hashes_differ(self):
        """bcrypt uses random salts, so two hashes of the same password differ."""
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2

    def test_empty_password(self):
        result = hash_password("")
        assert isinstance(result, str)
        assert len(result) > 0


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        plain = "correctpassword"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("correctpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_empty_plain_against_non_empty(self):
        hashed = hash_password("nonempty")
        assert verify_password("", hashed) is False

    def test_empty_both(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "user123"})
        assert isinstance(token, str)

    def test_token_has_three_parts(self):
        token = create_access_token({"sub": "user123"})
        assert len(token.split(".")) == 3

    def test_token_contains_sub(self):
        token = create_access_token({"sub": "user123"})
        payload = jwt.decode(token, mock_settings.JWT_SECRET_KEY, algorithms=[mock_settings.JWT_ALGORITHM])
        assert payload["sub"] == "user123"

    def test_custom_expiry(self):
        delta = timedelta(minutes=5)
        before = datetime.utcnow()
        token = create_access_token({"sub": "user123"}, expires_delta=delta)
        payload = jwt.decode(token, mock_settings.JWT_SECRET_KEY, algorithms=[mock_settings.JWT_ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])
        assert exp > before

    def test_default_expiry_applied(self):
        """Token expiry should be ~30 minutes from now when no delta given."""
        before = datetime.utcnow()
        token = create_access_token({"sub": "user123"})
        payload = jwt.decode(token, mock_settings.JWT_SECRET_KEY, algorithms=[mock_settings.JWT_ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])
        diff = (exp - before).total_seconds()
        # default is 30 min = 1800 sec, allow ±5 sec drift
        assert 1795 <= diff <= 1805


class TestDecodeAccessToken:
    def test_valid_token_returns_payload(self):
        token = create_access_token({"sub": "abc"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "abc"

    def test_invalid_token_returns_none(self):
        result = decode_access_token("not.a.token")
        assert result is None

    def test_tampered_token_returns_none(self):
        token = create_access_token({"sub": "abc"})
        tampered = token[:-3] + "xxx"
        result = decode_access_token(tampered)
        assert result is None

    def test_empty_string_returns_none(self):
        result = decode_access_token("")
        assert result is None
