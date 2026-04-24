from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any
import json
import asyncio

RATE_LIMIT_DELAY = 5

def extract_json(res):
    if isinstance(res, dict):
        return res
    if isinstance(res, list):
        return {"data": res}
    raise ValueError(f"Invalid LLM response: {res}")


async def generate_architecture(project: Project) -> Dict[str, Any]:
    backlog = project.stage3
    pvd = project.stage1["product_vision_document"]
    manifesto = project.stage2["selected_features_manifesto"]

    context = f"""
Product Vision:
{json.dumps(pvd)}

Features:
{json.dumps(manifesto)}

Sample User Stories:
{json.dumps(backlog.get("user_stories", [])[:8])}
"""

    tech_stack_prompt = """
You are a Principal Software Architect.

Analyze the system carefully using:
- Product Vision
- Features
- User Stories

Select a TECH STACK that BEST fits:
- scalability needs
- AI/ML requirements (if any)
- real-time vs batch needs
- user load expectations

STRICT RULES:
- Do NOT use generic stack blindly
- Justify choices internally (but DO NOT output reasoning)
- Choose only relevant technologies

Return STRICT JSON ONLY:
{
  "tech_stack": {
    "frontend": [],
    "backend": [],
    "database": [],
    "devops": [],
    "other": []
  }
}
"""

    tech_stack = extract_json(await structured_completion(
        tech_stack_prompt, context, temperature=0.2
    ))

    await asyncio.sleep(RATE_LIMIT_DELAY)

    endpoint_prompt = """
You are designing backend APIs.

IMPORTANT:
- You MUST derive endpoints from USER STORIES
- Each endpoint must map to real functionality

RULES:
- Cover authentication, core features, admin if needed
- MAX 10 endpoints
- Avoid duplicates
- Use RESTful design

STRICT JSON ONLY:
{
  "api_endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/v1/...",
      "description": "Mapped from specific user story",
      "request_body": {},
      "response": {},
      "auth_required": true
    }
  ]
}
"""

    endpoints = extract_json(await structured_completion(
        endpoint_prompt, context, temperature=0.2
    ))

    await asyncio.sleep(RATE_LIMIT_DELAY)

    database_prompt = """
You are designing database schema.

IMPORTANT:
- Entities MUST come from user stories and features
- Do NOT invent unrelated entities
- Normalize properly

RULES:
- MAX 5 entities
- Include relationships clearly

STRICT JSON:
{
  "database_schema": {
    "entities": [
      {
        "name": "",
        "collection": "",
        "fields": [],
        "relations": []
      }
    ]
  }
}
"""

    database = extract_json(await structured_completion(
        database_prompt, context, temperature=0.2
    ))

    await asyncio.sleep(RATE_LIMIT_DELAY)

    diagram_prompt = """
Generate architecture diagrams.

RULES:
- Keep SHORT and valid
- Escape newlines with \\n
- No extra formatting

STRICT JSON:
{
  "erd_mermaid": "erDiagram\\nA ||--o{ B : has",
  "system_diagram": "graph TD\\nClient-->API-->DB"
}
"""

    diagrams = extract_json(await structured_completion(
        diagram_prompt, context, temperature=0.2
    ))

    await asyncio.sleep(RATE_LIMIT_DELAY)

    decision_prompt = """
You are a Principal Software Architect.

Generate 3-5 architecture decisions.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- NO explanation text
- NO missing commas
- ALL fields must be properly separated by commas
- JSON must be parseable by Python json.loads()

FORMAT:
{
  "architecture_decisions": [
    {
      "decision": "string",
      "rationale": "string",
      "alternatives": [
        {
          "name": "string",
          "description": "string"
        }
      ]
    }
  ]
}
"""

    decisions = extract_json(await structured_completion(
        decision_prompt, context, temperature=0.2
    ))

    arch = {
        "tech_stack": tech_stack.get("tech_stack", {}),
        "api_endpoints": endpoints.get("api_endpoints", []),
        "database_schema": database.get("database_schema", {}),
        "erd_mermaid": diagrams.get("erd_mermaid", ""),
        "system_diagram": diagrams.get("system_diagram", ""),
        "architecture_decisions": decisions.get("architecture_decisions", []),
        "status": "in_progress"
    }

    return arch


async def modify_architecture(stage: Dict, prompt: str) -> Dict:
    arch_copy = {k: v for k, v in stage.items() if k != "status"}

    updated = await structured_completion(
        """Modify architecture. Return full JSON only.""",
        f"{json.dumps(arch_copy)}\n\n{prompt}",
        temperature=0.3,
    )

    updated["status"] = "in_progress"
    return updated


def confirm_architecture(stage: Dict) -> Dict:
    stage["status"] = "completed"
    return stage
