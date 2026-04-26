"""
Unit tests for app/services/stage1_service.py
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


# ─── Helpers ──────────────────────────────────────────────────────────────────
def make_project(stage1=None):
    p = MagicMock()
    p.stage1 = stage1
    p.save = AsyncMock()
    return p


# ─── process_chat ─────────────────────────────────────────────────────────────
class TestProcessChat:
    @pytest.mark.asyncio
    async def test_initialises_stage_when_none(self):
        from app.services.stage1_service import process_chat

        project = make_project(stage1=None)

        ai_reply = "Tell me more about your idea.\n<score>{\"core_problem\": 0.3, \"target_persona\": 0.0, \"user_flow\": 0.0, \"success_metrics\": 0.0, \"overall\": 0.1}</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "I want to build a todo app")

        assert "chat_history" in result
        assert len(result["chat_history"]) == 2  # user + assistant

    @pytest.mark.asyncio
    async def test_appends_to_existing_chat_history(self):
        from app.services.stage1_service import process_chat

        existing_stage = {
            "status": "in_progress",
            "chat_history": [
                {"role": "user", "content": "first message", "timestamp": datetime.utcnow().isoformat()},
                {"role": "assistant", "content": "first reply", "timestamp": datetime.utcnow().isoformat()},
            ],
            "readiness_score": 0.2,
            "pillars": {
                "core_problem": {"score": 0.2, "content": ""},
                "target_persona": {"score": 0.0, "content": ""},
                "user_flow": {"score": 0.0, "content": ""},
                "success_metrics": {"score": 0.0, "content": ""},
            },
            "product_vision_document": None,
        }

        project = make_project(stage1=existing_stage)
        ai_reply = "Great, keep going!\n<score>{\"core_problem\": 0.5, \"target_persona\": 0.1, \"user_flow\": 0.0, \"success_metrics\": 0.0, \"overall\": 0.15}</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "second message")

        assert len(result["chat_history"]) == 4  # 2 existing + 2 new

    @pytest.mark.asyncio
    async def test_scores_parsed_from_response(self):
        from app.services.stage1_service import process_chat

        project = make_project(stage1=None)
        ai_reply = "Good description!\n<score>{\"core_problem\": 0.8, \"target_persona\": 0.7, \"user_flow\": 0.6, \"success_metrics\": 0.5, \"overall\": 0.65}</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "My app does X")

        assert result["readiness_score"] == pytest.approx(0.65)
        assert result["pillars"]["core_problem"]["score"] == pytest.approx(0.8)

    @pytest.mark.asyncio
    async def test_score_tag_stripped_from_ai_message(self):
        from app.services.stage1_service import process_chat

        project = make_project(stage1=None)
        ai_reply = "Interesting!\n<score>{\"core_problem\": 0.5, \"target_persona\": 0.5, \"user_flow\": 0.5, \"success_metrics\": 0.5, \"overall\": 0.5}</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "hello")

        assistant_msg = result["chat_history"][1]["content"]
        assert "<score>" not in assistant_msg

    @pytest.mark.asyncio
    async def test_malformed_score_falls_back_to_zeros(self):
        from app.services.stage1_service import process_chat

        project = make_project(stage1=None)
        ai_reply = "Here is my reply.\n<score>NOT JSON</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "something")

        assert result["readiness_score"] == pytest.approx(0.0)

    @pytest.mark.asyncio
    async def test_overall_computed_from_pillars_when_missing(self):
        from app.services.stage1_service import process_chat

        project = make_project(stage1=None)
        # No "overall" key in the score block
        score_json = '{"core_problem": 0.4, "target_persona": 0.4, "user_flow": 0.4, "success_metrics": 0.4}'
        ai_reply = f"reply\n<score>{score_json}</score>"

        with patch("app.services.stage1_service.chat_completion", AsyncMock(return_value=ai_reply)):
            result = await process_chat(project, "hi")

        assert result["readiness_score"] == pytest.approx(0.4)


# ─── generate_pvd ─────────────────────────────────────────────────────────────
class TestGeneratePvd:
    @pytest.mark.asyncio
    async def test_pvd_stored_in_stage(self):
        from app.services.stage1_service import generate_pvd

        stage = {
            "status": "in_progress",
            "chat_history": [
                {"role": "user", "content": "I want to build X", "timestamp": "t"},
                {"role": "assistant", "content": "Tell me more", "timestamp": "t"},
            ],
        }
        project = make_project(stage1=stage)

        fake_pvd = {"title": "Project X", "problem_statement": "..."}
        with patch("app.services.stage1_service.structured_completion", AsyncMock(return_value=fake_pvd)):
            result = await generate_pvd(project)

        assert result["product_vision_document"] == fake_pvd

    @pytest.mark.asyncio
    async def test_status_set_to_completed(self):
        from app.services.stage1_service import generate_pvd

        stage = {
            "status": "in_progress",
            "chat_history": [
                {"role": "user", "content": "x", "timestamp": "t"},
            ],
        }
        project = make_project(stage1=stage)

        with patch("app.services.stage1_service.structured_completion", AsyncMock(return_value={})):
            result = await generate_pvd(project)

        assert result["status"] == "completed"

    @pytest.mark.asyncio
    async def test_pvd_called_with_conversation_text(self):
        from app.services.stage1_service import generate_pvd

        stage = {
            "status": "in_progress",
            "chat_history": [
                {"role": "user", "content": "Hello world", "timestamp": "t"},
            ],
        }
        project = make_project(stage1=stage)

        mock_structured = AsyncMock(return_value={})
        with patch("app.services.stage1_service.structured_completion", mock_structured):
            await generate_pvd(project)

        call_args = mock_structured.call_args
        user_prompt_arg = call_args[0][1]  # second positional arg
        assert "Hello world" in user_prompt_arg
