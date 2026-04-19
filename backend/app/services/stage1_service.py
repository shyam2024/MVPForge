from app.services.ai_service import chat_completion, structured_completion
from app.models.project import Project
from typing import Dict, Any, List
from datetime import datetime
import json

SYSTEM_PROMPT = """You are a Senior Product Discovery Analyst conducting a structured discovery interview.
Your goal is to deeply understand the user's software idea by exploring 4 pillars:
1. Core Problem - What specific problem are we solving?
2. Target Persona - Who exactly experiences this problem?
3. User Flow - How will users interact with the solution?
4. Success Metrics - How will we measure success?

Guidelines:
- Ask ONE focused question at a time
- Build on previous answers
- Probe for specifics when answers are vague
- Be encouraging but thorough
- When a pillar is well-understood, move to the next
- After gathering enough information, signal readiness

Always end your response with a JSON block (wrapped in <score></score> tags) containing readiness scores:
<score>
{
  "core_problem": 0.0-1.0,
  "target_persona": 0.0-1.0,
  "user_flow": 0.0-1.0,
  "success_metrics": 0.0-1.0,
  "overall": 0.0-1.0
}
</score>
"""

SCORING_SYSTEM = """You are an AI that extracts a Product Vision Document from a discovery conversation.
Analyze the conversation and return a structured JSON document."""


async def process_chat(project: Project, user_message: str) -> Dict[str, Any]:
    stage = project.stage1 or {
        "status": "in_progress",
        "chat_history": [],
        "readiness_score": 0.0,
        "pillars": {
            "core_problem": {"score": 0.0, "content": ""},
            "target_persona": {"score": 0.0, "content": ""},
            "user_flow": {"score": 0.0, "content": ""},
            "success_metrics": {"score": 0.0, "content": ""},
        },
        "product_vision_document": None,
    }

    chat_history = stage.get("chat_history", [])

    # Get AI response
    ai_response = await chat_completion(
        SYSTEM_PROMPT,
        chat_history,
        user_message,
        temperature=0.7,
    )

    # Parse scores from response
    import re
    score_match = re.search(r"<score>(.*?)</score>", ai_response, re.DOTALL)
    scores = {"core_problem": 0.0, "target_persona": 0.0, "user_flow": 0.0, "success_metrics": 0.0, "overall": 0.0}
    if score_match:
        try:
            scores = json.loads(score_match.group(1))
            ai_response = ai_response[:ai_response.find("<score>")].strip()
        except:
            pass

    # Update chat history
    chat_history.append({"role": "user", "content": user_message, "timestamp": datetime.utcnow().isoformat()})
    chat_history.append({"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow().isoformat()})

    overall = scores.get("overall", sum([
        scores.get("core_problem", 0),
        scores.get("target_persona", 0),
        scores.get("user_flow", 0),
        scores.get("success_metrics", 0),
    ]) / 4)

    stage["chat_history"] = chat_history
    stage["readiness_score"] = overall
    stage["pillars"] = {
        "core_problem": {"score": scores.get("core_problem", 0), "content": stage["pillars"].get("core_problem", {}).get("content", "")},
        "target_persona": {"score": scores.get("target_persona", 0), "content": stage["pillars"].get("target_persona", {}).get("content", "")},
        "user_flow": {"score": scores.get("user_flow", 0), "content": stage["pillars"].get("user_flow", {}).get("content", "")},
        "success_metrics": {"score": scores.get("success_metrics", 0), "content": stage["pillars"].get("success_metrics", {}).get("content", "")},
    }

    return stage


async def generate_pvd(project: Project) -> Dict[str, Any]:
    """Generate Product Vision Document from chat history."""
    stage = project.stage1
    chat_history = stage.get("chat_history", [])

    conversation_text = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in chat_history
    ])

    pvd = await structured_completion(
        """Extract a complete Product Vision Document from this discovery conversation.
Return JSON with exactly this structure:
{
  "title": "project title",
  "problem_statement": "clear problem description",
  "target_audience": {"primary": "...", "secondary": "...", "pain_points": []},
  "user_flow": {"steps": [], "key_interactions": []},
  "success_metrics": {"quantitative": [], "qualitative": []},
  "core_features": [],
  "constraints": [],
  "raw_summary": "executive summary paragraph"
}""",
        f"Discovery conversation:\n\n{conversation_text}",
        temperature=0.2,
    )

    stage["product_vision_document"] = pvd
    stage["status"] = "completed"
    return stage
