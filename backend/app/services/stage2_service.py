from app.services.ai_service import structured_completion
from app.models.project import Project
from typing import Dict, Any
import uuid


async def generate_features(project: Project) -> Dict[str, Any]:
    pvd = project.stage1["product_vision_document"]

    epics = await structured_completion(
        """You are a Senior Product Manager. Given a Product Vision Document, extract functional Epics and Features.
Return JSON with this exact structure:
{
  "epics": [
    {
      "id": "epic-uuid",
      "name": "Epic Name",
      "description": "What this module handles",
      "features": [
        {
          "id": "feature-uuid",
          "name": "Feature Name",
          "description": "What this feature does and why it's valuable",
          "enabled": true,
          "priority": "must-have|should-have|nice-to-have",
          "complexity": "low|medium|high"
        }
      ]
    }
  ]
}
Always include auth/user management epic. Generate 5-8 epics with 3-5 features each.
Assign unique UUIDs for all ids.""",
        f"Product Vision Document:\n{pvd}",
        temperature=0.4,
    )

    return {
        "status": "in_progress",
        "epics": epics.get("epics", []),
        "selected_features_manifesto": [],
    }


def toggle_feature(stage: Dict, epic_id: str, feature_id: str, enabled: bool) -> Dict:
    for epic in stage["epics"]:
        if epic["id"] == epic_id:
            for feature in epic["features"]:
                if feature["id"] == feature_id:
                    feature["enabled"] = enabled
                    break
    return stage


def build_manifesto(stage: Dict) -> Dict:
    manifesto = []
    for epic in stage["epics"]:
        enabled_features = [f for f in epic["features"] if f.get("enabled", True)]
        if enabled_features:
            manifesto.append({
                "epic_id": epic["id"],
                "epic_name": epic["name"],
                "epic_description": epic["description"],
                "features": enabled_features,
            })
    stage["selected_features_manifesto"] = manifesto
    stage["status"] = "completed"
    return stage
