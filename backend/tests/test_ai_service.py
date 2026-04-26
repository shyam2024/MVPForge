"""
Unit tests for app/services/ai_service.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ─── build_messages ──────────────────────────────────────────────────────────
class TestBuildMessages:
    def test_empty_history(self):
        from app.services.ai_service import build_messages
        from langchain_core.messages import HumanMessage

        result = build_messages([], "hello")
        assert len(result) == 1
        assert isinstance(result[0], HumanMessage)
        assert result[0].content == "hello"

    def test_history_interleaved(self):
        from app.services.ai_service import build_messages
        from langchain_core.messages import HumanMessage, AIMessage

        history = [
            {"role": "user", "content": "first"},
            {"role": "assistant", "content": "reply"},
        ]
        result = build_messages(history, "second")
        assert len(result) == 3
        assert isinstance(result[0], HumanMessage)
        assert isinstance(result[1], AIMessage)
        assert isinstance(result[2], HumanMessage)

    def test_unknown_role_skipped(self):
        from app.services.ai_service import build_messages

        history = [{"role": "system", "content": "ignored"}]
        result = build_messages(history, "msg")
        # Only the new HumanMessage should be in the list
        assert len(result) == 1


# ─── chat_completion ──────────────────────────────────────────────────────────
class TestChatCompletion:
    @pytest.mark.asyncio
    async def test_returns_string_response(self):
        from app.services.ai_service import chat_completion

        mock_response = MagicMock()
        mock_response.content = "AI response text"

        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            result = await chat_completion("system", [], "user msg")

        assert result == "AI response text"

    @pytest.mark.asyncio
    async def test_system_prompt_included(self):
        from app.services.ai_service import chat_completion
        from langchain_core.messages import SystemMessage

        mock_response = MagicMock()
        mock_response.content = "ok"
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            await chat_completion("My system prompt", [], "hello")

        call_args = mock_llm.ainvoke.call_args[0][0]
        assert isinstance(call_args[0], SystemMessage)
        assert call_args[0].content == "My system prompt"

    @pytest.mark.asyncio
    async def test_history_messages_passed(self):
        from app.services.ai_service import chat_completion
        from langchain_core.messages import HumanMessage

        mock_response = MagicMock()
        mock_response.content = "ok"
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        history = [{"role": "user", "content": "prior message"}]
        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            await chat_completion("sys", history, "new msg")

        call_args = mock_llm.ainvoke.call_args[0][0]
        # system + prior user + new user = 3 messages
        assert len(call_args) == 3


# ─── structured_completion ────────────────────────────────────────────────────
class TestStructuredCompletion:
    @pytest.mark.asyncio
    async def test_returns_parsed_json(self):
        from app.services.ai_service import structured_completion

        mock_response = MagicMock()
        mock_response.content = '{"key": "value"}'
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            result = await structured_completion("sys", "user")

        assert result == {"key": "value"}

    @pytest.mark.asyncio
    async def test_strips_markdown_code_fences(self):
        from app.services.ai_service import structured_completion

        mock_response = MagicMock()
        mock_response.content = "```json\n{\"a\": 1}\n```"
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            result = await structured_completion("sys", "user")

        assert result == {"a": 1}

    @pytest.mark.asyncio
    async def test_raises_on_invalid_json(self):
        from app.services.ai_service import structured_completion
        import json

        mock_response = MagicMock()
        mock_response.content = "not json at all"
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            with pytest.raises(json.JSONDecodeError):
                await structured_completion("sys", "user")


# ─── single_completion ────────────────────────────────────────────────────────
class TestSingleCompletion:
    @pytest.mark.asyncio
    async def test_returns_string(self):
        from app.services.ai_service import single_completion

        mock_response = MagicMock()
        mock_response.content = "plain text answer"
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        with patch("app.services.ai_service.get_llm", return_value=mock_llm):
            result = await single_completion("system", "prompt")

        assert result == "plain text answer"
