from app.services.ai_service import structured_completion, single_completion
from app.models.project import Project
from typing import Dict, Any
import json
import asyncio
import re

RATE_LIMIT_DELAY = 3


def clean_html(raw: str) -> str:
    if not isinstance(raw, str):
        return ""
    raw = re.sub(r"```html|```", "", raw)

    html_end = raw.lower().rfind("</html>")
    if html_end != -1:
        raw = raw[:html_end + len("</html>")]
    raw = (
        raw.replace("\\n", "\n")
           .replace('\\"', '"')
           .replace("\\t", "\t")
    )
    raw = (
        raw.replace("\n", "")
           .replace('\"', '"')
           .replace("\t", "	")
    )
    return raw.strip()

async def generate_ui_screens(project: Project) -> Dict[str, Any]:
    pvd = project.stage1["product_vision_document"]
    manifesto = project.stage2["selected_features_manifesto"]

    planning_prompt = """
You are a Senior UI/UX Architect.

Design the UI system for the application.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No explanation, no markdown
- JSON must be simple and NOT deeply nested
- Avoid nested objects inside arrays
- Use TEXT instead of nested structures where possible

GOALS:
1. Define a clean design system
2. Define all screens with clear textual descriptions

DESIGN SYSTEM:
- Define colors (5-6)
- Define typography
- Define reusable components (list of names only)

SCREEN PLAN:
- Generate 5-8 screens
- Each screen must be meaningful and tied to features

Each screen MUST include:
- id
- name
- route
- description (detailed)
- key_components (TEXT, comma-separated)
- data_display (TEXT, what data is shown)

RETURN JSON:
{
  "design_system": {
    "colors": {
      "primary": "",
      "secondary": "",
      "accent": "",
      "background": "",
      "surface": "",
      "text": ""
    },
    "typography": {
      "heading_font": "",
      "body_font": ""
    },
    "components": []
  },
  "screens_plan": [
    {
      "id": "screen-1",
      "name": "",
      "route": "",
      "description": "",
      "key_components": "",
      "data_display": ""
    }
  ]
}
"""

    context = f"""
Project:
{json.dumps(pvd)}

Features:
{json.dumps([e['epic_name'] for e in manifesto])}
"""

    planning_data = await structured_completion(planning_prompt, context, temperature=0.3)

    design_system = planning_data.get("design_system", {})
    screens_plan = planning_data.get("screens_plan", [])

    screens = []

    routes = [s["route"] for s in screens_plan]
    

    for screen in screens_plan:
        html_prompt = f"""
You are a Senior UI/UX Designer and Frontend Engineer specializing in modern SaaS applications.
Your task is to generate a COMPLETE, PROFESSIONAL, PRODUCTION-QUALITY HTML UI screen.

STRICT OUTPUT RULES

- Return ONLY RAW HTML (no JSON, no markdown, no explanation)
- DO NOT include ```html or any markdown
- DO NOT escape quotes (no \")
- DO NOT include escaped characters like \n
- Output must be directly runnable in a browser
- Output MUST start with: <!DOCTYPE html>
- Output MUST end with: </html>

HTML STRUCTURE REQUIREMENTS

- Must include: <!DOCTYPE html>, <html>, <head>, <body>
- Include Tailwind CDN EXACTLY like this:
  <script src="https://cdn.tailwindcss.com"></script>
- DO NOT use <link> for Tailwind
- Include Google Fonts ONLY if provided in design system
- Use semantic HTML where possible

DESIGN SYSTEM RULES

- STRICTLY follow provided design_system
- If custom tokens like "primary", "background" are given: Convert them into VALID Tailwind classes OR define them in <style>
- DO NOT use invalid Tailwind classes like: bg-surface, text-text, bg-background, bg-accent
- ONLY use valid Tailwind classes OR properly defined CSS variables

LAYOUT RULES (VERY IMPORTANT)

- Use modern layout (Flexbox or Grid)
- Navbar must be fixed at top or clearly placed
- Sidebar (if used) must NOT overlap content
- Use layout structure like:

  <div class="flex h-screen">
    <aside class="w-64">Sidebar</aside>
    <div class="flex-1">
      <nav>Navbar</nav>
      <main>Main Content</main>
    </div>
  </div>

- Main content must be properly spaced and readable
- Use containers (max-w, mx-auto) where needed

COMPONENT RULES

- Use reusable UI patterns:
  - Navbar
  - Sidebar
  - Cards
  - Forms
  - Tables
- Use cards (bg-white, shadow, rounded-lg) for grouping
- Maintain consistent padding (p-4, p-6)

NAVIGATION RULES

- Include ALL routes in navigation
- Highlight current route visually
- Navigation must be consistent and usable

DATA & CONTENT RULES

- Use realistic mock data
- Show actual UI states:
  - Tables with rows
  - Cards with content
  - Forms with placeholders
- Avoid empty UI

RESPONSIVENESS

- Use responsive Tailwind classes (md:, lg:)
- UI must look good on desktop at minimum

HARD CONSTRAINTS

- Max ~300 lines
- Avoid repeated code
- No inline JS unless necessary
- No broken HTML
- No invalid Tailwind classes

INPUT

Design System:
{design_system}

All Routes:
{routes}

Screen:
{json.dumps(screen, indent=2)}

GOAL

Generate a CLEAN, PROFESSIONAL, CONSISTENT SaaS UI screen that looks like a real product, not a demo.
"""

        raw_html = await single_completion(html_prompt, "", temperature=0.5)
        html = clean_html(raw_html)

        screens.append({
            "id": screen["id"],
            "name": screen["name"],
            "route": screen["route"],
            "description": screen["description"],
            "html_content": html,
            "approved": False
        })

        await asyncio.sleep(RATE_LIMIT_DELAY)

    return {
        "design_system": design_system,
        "screens": screens,
        "status": "in_progress"
    }


async def edit_screen(stage: Dict, screen_id: str, prompt: str) -> Dict:
    screen = next((s for s in stage["screens"] if s["id"] == screen_id), None)

    if not screen:
        raise ValueError(f"Screen {screen_id} not found")

    new_html = await single_completion(
        "Modify the HTML UI. Return ONLY HTML.",
        f"{screen['html_content']}\n\nChange: {prompt}",
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
