from app.services.ai_service import structured_completion, single_completion
from app.models.project import Project
from typing import Dict, Any
import json


async def generate_ui_screens(project: Project) -> Dict[str, Any]:
    pvd = project.stage1["product_vision_document"]
    arch = project.stage4
    manifesto = project.stage2["selected_features_manifesto"]

    screens_data = await structured_completion(
        """You are a Senior UI/UX Designer and Frontend Engineer.
Generate HTML+Tailwind CSS prototype screens.
Return JSON:
{
  "design_system": {
    "colors": {
      "primary": "#...",
      "secondary": "#...",
      "accent": "#...",
      "background": "#...",
      "surface": "#...",
      "text": "#..."
    },
    "typography": {
      "heading_font": "...",
      "body_font": "...",
      "scale": {}
    },
    "components": ["Button", "Card", "Input", ...]
  },
  "screens": [
    {
      "id": "screen-uuid",
      "name": "Screen Name",
      "route": "/path",
      "description": "What this screen does",
      "html_content": "FULL self-contained HTML with Tailwind CDN and inline styles",
      "approved": false
    }
  ]
}
Generate screens for: Login, Register, Dashboard, and main feature screens.
Each html_content MUST be a complete, self-contained HTML page with:
- <html> tag with Tailwind CDN script
- Realistic UI with proper navigation, sidebar if needed
- Mock data to show realistic UI state
- Beautiful, professional design
Generate 5-8 screens minimum.""",
        f"Project: {pvd.get('title', 'App')}\nFeatures: {json.dumps([e['epic_name'] for e in manifesto], indent=2)}",
        temperature=0.5,
    )

    screens_data["status"] = "in_progress"
    return screens_data


async def edit_screen(stage: Dict, screen_id: str, prompt: str) -> Dict:
    screen = next((s for s in stage["screens"] if s["id"] == screen_id), None)
    if not screen:
        raise ValueError(f"Screen {screen_id} not found")

    new_html = await single_completion(
        "You are a Senior UI/UX Designer. Modify the HTML screen based on the user's request. Return ONLY the updated complete HTML, no explanation.",
        f"Current HTML:\n{screen['html_content']}\n\nModification: {prompt}",
        temperature=0.5,
    )

    screen["html_content"] = new_html
    return stage


def approve_screen(stage: Dict, screen_id: str) -> Dict:
    for screen in stage["screens"]:
        if screen["id"] == screen_id:
            screen["approved"] = True
    return stage


def confirm_ui(stage: Dict) -> Dict:
    stage["status"] = "completed"
    return stage
