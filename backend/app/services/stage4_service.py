from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any
import json


async def generate_architecture(project: Project) -> Dict[str, Any]:
    backlog = project.stage3
    pvd = project.stage1["product_vision_document"]
    manifesto = project.stage2["selected_features_manifesto"]

    arch = await structured_completion(
        """You are a Principal Software Architect. Design a complete system architecture.
Return JSON with this exact structure:
{
  "tech_stack": {
    "frontend": ["Next.js 14", "TypeScript", "Tailwind CSS", "Shadcn/UI"],
    "backend": ["FastAPI", "Python 3.11", "LangChain"],
    "database": ["MongoDB Atlas"],
    "devops": ["Docker", "GitHub Actions"],
    "other": []
  },
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/api/v1/...",
      "description": "...",
      "request_body": {},
      "response": {},
      "auth_required": true
    }
  ],
  "database_schema": {
    "entities": [
      {
        "name": "EntityName",
        "collection": "collection_name",
        "fields": [
          {"name": "field", "type": "string|number|boolean|ObjectId|array|object", "constraints": ["required", "unique", "indexed"]}
        ],
        "relations": [
          {"type": "one-to-many|many-to-many", "target": "OtherEntity", "via": "field_name"}
        ]
      }
    ]
  },
  "erd_mermaid": "erDiagram\\n  EntityA ||--o{ EntityB : has\\n  ...",
  "system_diagram": "graph TD\\n  Client --> API\\n  API --> DB\\n  ...",
  "architecture_decisions": [
    {"decision": "...", "rationale": "...", "alternatives": []}
  ]
}
Generate ALL necessary endpoints for the backlog. Include auth endpoints.
Make ERD mermaid diagram comprehensive.""",
        f"""
Project Vision: {json.dumps(pvd, indent=2)}
Features: {json.dumps(manifesto, indent=2)}
User Stories count: {len(backlog.get('user_stories', []))}
""",
        temperature=0.2,
    )

    arch["status"] = "in_progress"
    return arch


async def modify_architecture(stage: Dict, prompt: str) -> Dict:
    arch_copy = {k: v for k, v in stage.items() if k != "status"}

    updated = await structured_completion(
        """You are a Principal Software Architect. Modify the architecture based on the user's request.
Return the COMPLETE updated architecture JSON (same structure as input, with changes applied).""",
        f"Current architecture:\n{json.dumps(arch_copy, indent=2)}\n\nModification request: {prompt}",
        temperature=0.3,
    )

    updated["status"] = "in_progress"
    return updated


def confirm_architecture(stage: Dict) -> Dict:
    stage["status"] = "completed"
    return stage
