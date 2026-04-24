from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any, List
import json
import asyncio
import uuid

BATCH_SIZE = 5
RATE_LIMIT_DELAY = 5
MAX_RETRIES = 2


def chunk_list(data: List, size: int) -> List[List]:
    return [data[i:i + size] for i in range(0, len(data), size)]


def validate_ids(input_stories: List[Dict], output_stories: List[Dict]):
    in_ids = {s["id"] for s in input_stories}
    out_ids = {s["id"] for s in output_stories}
    if in_ids != out_ids:
        raise ValueError("Mismatch in story IDs")


async def safe_call(prompt: str, input_text: str, temperature=0.4):
    for attempt in range(MAX_RETRIES):
        try:
            return await structured_completion(prompt, input_text, temperature=temperature)
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                raise e
            await asyncio.sleep(1)


async def generate_backlog(project: Project) -> Dict[str, Any]:

    manifesto = project.stage2["selected_features_manifesto"]

    features = []
    for epic in manifesto:
        for f in epic.get("features", []):
            f_copy = f.copy()
            f_copy["epic_id"] = epic.get("epic_id")
            f_copy["epic_name"] = epic.get("epic_name")
            features.append(f_copy)

    all_stories = []

    for batch in chunk_list(features, BATCH_SIZE):

        prompt = """Generate 1-2 user stories per feature.

Return JSON ONLY:
{
  "user_stories": [
    {
      "feature_id": "...",
      "feature_name": "...",
      "title": "...",
      "as_a": "...",
      "i_want": "...",
      "so_that": "...",
      "status": "draft",
      "priority": "high|medium|low",
      "story_points": 1-13
    }
  ]
}
You MUST return STRICT JSON.

RULES:
- Return ONLY JSON
- No explanation
- No markdown
- No text before or after JSON
- JSON must start with '{' and end with '}'
- Keys MUST be in double quotes
- Do NOT return a list directly

If you fail, your response is INVALID.
"""

        res = await safe_call(prompt, json.dumps(batch, indent=2))
        batch_stories = res.get("user_stories", [])

        for s in batch_stories:
            s["id"] = str(uuid.uuid4())

        all_stories.extend(batch_stories)

        await asyncio.sleep(RATE_LIMIT_DELAY)

    print("\n=== PHASE 1 COMPLETE ===")
    print(json.dumps(all_stories[:2], indent=2))


    story_map = {s["id"]: s for s in all_stories}

    for batch in chunk_list(all_stories, BATCH_SIZE):

        prompt = """For EACH story generate:
- acceptance_criteria (2-3)
- failure_criteria (2-3)

STRICT:
- Use EXACT same IDs
- Do NOT change order

Return JSON:
{
  "user_stories": [
    {
      "id": "...",
      "acceptance_criteria": [...],
      "failure_criteria": [...]
    }
  ]
}
You MUST return STRICT JSON.

RULES:
- Return ONLY JSON
- No explanation
- No markdown
- No text before or after JSON
- JSON must start with '{' and end with '}'
- Keys MUST be in double quotes
- Do NOT return a list directly

If you fail, your response is INVALID.
"""

        res = await safe_call(prompt, json.dumps({"user_stories": batch}, indent=2))

        validate_ids(batch, res["user_stories"])

        for s in res["user_stories"]:
            story_map[s["id"]]["acceptance_criteria"] = s["acceptance_criteria"]
            story_map[s["id"]]["failure_criteria"] = s["failure_criteria"]

        await asyncio.sleep(RATE_LIMIT_DELAY)

    print("\n=== PHASE 2 COMPLETE ===")
    print(json.dumps(list(story_map.values())[:2], indent=2))

    for batch in chunk_list(all_stories, BATCH_SIZE):

        prompt = """Generate INVEST score.

STRICT:
- Use EXACT same IDs

Return JSON:
{
  "user_stories": [
    {
      "id": "...",
      "invest_score": {
        "independent": 1-5,
        "negotiable": 1-5,
        "valuable": 1-5,
        "estimable": 1-5,
        "small": 1-5,
        "testable": 1-5,
        "total": 0.0-1.0
      }
    }
  ]
}
You MUST return STRICT JSON.

RULES:
- Return ONLY JSON
- No explanation
- No markdown
- No text before or after JSON
- JSON must start with '{' and end with '}'
- Keys MUST be in double quotes
- Do NOT return a list directly

If you fail, your response is INVALID.
"""

        res = await safe_call(prompt, json.dumps({"user_stories": batch}, indent=2))
        print("\n=== RAW PHASE 3 RESPONSE ===")
        print(res)
        print(type(res))

        validate_ids(batch, res["user_stories"])

        for s in res["user_stories"]:
            score = s["invest_score"]

            for k in ["independent","negotiable","valuable","estimable","small","testable"]:
                score[k] = max(1, min(5, score.get(k, 3)))

            vals = [score[k] for k in ["independent","negotiable","valuable","estimable","small","testable"]]
            score["total"] = round(sum(vals) / 30, 2)

            story_map[s["id"]]["invest_score"] = score

        await asyncio.sleep(RATE_LIMIT_DELAY)

    print("\n=== PHASE 3 COMPLETE ===")
    print(json.dumps(list(story_map.values())[:2], indent=2))

    for story in story_map.values():
        feature = next(
            (f for f in features if f.get("id") == story.get("feature_id")),
            {}
        )
        story["epic_id"] = feature.get("epic_id", "")
        story["epic_name"] = feature.get("epic_name", "")
        story["feature_name"] = feature.get("name", story.get("feature_name", ""))

    all_stories = list(story_map.values())

    draft = list(set(s["id"] for s in all_stories if s.get("status") == "draft"))

    return {
        "status": "in_progress",
        "user_stories": all_stories,
        "backlog": {"draft": draft, "confirmed": []},
    }


def move_story(stage: Dict, story_id: str, new_status: str) -> Dict:
    backlog = stage["backlog"]

    backlog["draft"] = [s for s in backlog.get("draft", []) if s != story_id]
    backlog["confirmed"] = [s for s in backlog.get("confirmed", []) if s != story_id]

    if new_status == "confirmed":
        backlog["confirmed"].append(story_id)
    else:
        backlog["draft"].append(story_id)

    for story in stage["user_stories"]:
        if story["id"] == story_id:
            story["status"] = new_status
            break

    stage["backlog"] = backlog
    return stage


def edit_story_field(stage: Dict, story_id: str, field: str, value: Any) -> Dict:
    allowed_fields = [
        "title", "as_a", "i_want", "so_that",
        "acceptance_criteria", "failure_criteria",
        "priority", "story_points"
    ]

    if field not in allowed_fields:
        raise ValueError(f"Field {field} is not editable")

    for story in stage["user_stories"]:
        if story["id"] == story_id:
            story[field] = value
            break

    return stage


async def regenerate_story(stage: Dict, story_id: str, prompt: str) -> Dict:
    story = next((s for s in stage["user_stories"] if s["id"] == story_id), None)

    if not story:
        raise ValueError(f"Story {story_id} not found")

    new_story_data = await structured_completion(
        """You are an Agile Coach. Regenerate this user story. Return JSON only.""",
        f"{json.dumps(story, indent=2)}\n\nPrompt: {prompt}",
        temperature=0.5,
    )

    new_story_data["id"] = story["id"]
    new_story_data["epic_id"] = story["epic_id"]
    new_story_data["feature_id"] = story.get("feature_id", "")
    new_story_data["status"] = story.get("status", "draft")

    for i, s in enumerate(stage["user_stories"]):
        if s["id"] == story_id:
            stage["user_stories"][i] = new_story_data
            break

    return stage


def confirm_backlog(stage: Dict) -> Dict:
    stage["status"] = "completed"
    return stage
