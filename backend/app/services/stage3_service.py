from app.services.ai_service import structured_completion, single_completion
from app.models.project import Project
from typing import Dict, Any, List
import json


async def generate_backlog(project: Project) -> Dict[str, Any]:
    manifesto = project.stage2["selected_features_manifesto"]

    backlog_data = await structured_completion(
        """You are an Agile Coach and Senior BA. Generate a detailed backlog from feature manifesto.
For each feature, generate 3-5 user stories with full INVEST quality.
Return JSON:
{
  "user_stories": [
    {
      "id": "story-uuid",
      "epic_id": "...",
      "epic_name": "...",
      "feature_id": "...",
      "feature_name": "...",
      "title": "Short title",
      "as_a": "user role",
      "i_want": "goal/desire",
      "so_that": "benefit/value",
      "acceptance_criteria": [
        "Given X, When Y, Then Z",
        ...4-5 criteria total...
      ],
      "failure_criteria": [
        "Given X, When Y, Then system should NOT...",
        ...2-3 criteria...
      ],
      "invest_score": {
        "independent": 1-5,
        "negotiable": 1-5,
        "valuable": 1-5,
        "estimable": 1-5,
        "small": 1-5,
        "testable": 1-5,
        "total": 0.0-1.0
      },
      "status": "draft",
      "priority": "high|medium|low",
      "story_points": 1-13
    }
  ]
}
Generate stories for ALL features in the manifesto.""",
        f"Features Manifesto:\n{json.dumps(manifesto, indent=2)}",
        temperature=0.4,
    )

    stories = backlog_data.get("user_stories", [])
    draft = [s["id"] for s in stories if s.get("status") == "draft"]

    return {
        "status": "in_progress",
        "user_stories": stories,
        "backlog": {"draft": draft, "confirmed": []},
    }


def move_story(stage: Dict, story_id: str, new_status: str) -> Dict:
    backlog = stage["backlog"]
    # Remove from all columns
    backlog["draft"] = [s for s in backlog.get("draft", []) if s != story_id]
    backlog["confirmed"] = [s for s in backlog.get("confirmed", []) if s != story_id]

    if new_status == "confirmed":
        backlog["confirmed"].append(story_id)
    else:
        backlog["draft"].append(story_id)

    # Update story status
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
        """You are an Agile Coach. Regenerate this user story based on the user's modification prompt.
Keep the same JSON structure and id. Return only the updated story JSON object.""",
        f"Current story:\n{json.dumps(story, indent=2)}\n\nModification prompt: {prompt}",
        temperature=0.5,
    )

    # Preserve id, epic_id, feature_id
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
